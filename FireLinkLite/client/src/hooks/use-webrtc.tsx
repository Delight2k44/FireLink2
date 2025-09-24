import { useRef, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface WebRTCHook {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isConnecting: boolean;
  startCall: (alertId: string, role: "agent" | "user") => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  connectionId: string | null;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC(): WebRTCHook {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close WebSocket
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionId(null);
  }, [localStream]);

  const initializeWebSocket = useCallback((alertId: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/webrtc`;

    webSocketRef.current = new WebSocket(wsUrl);

    webSocketRef.current.onopen = () => {
      console.log("WebRTC WebSocket connected");
    };

    webSocketRef.current.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "connection-established":
            setConnectionId(message.data.connectionId);
            break;

          case "offer":
            await handleOffer(message.data, message.from);
            break;

          case "answer":
            await handleAnswer(message.data);
            break;

          case "ice-candidate":
            await handleIceCandidate(message.data);
            break;

          case "user-joined":
            console.log("User joined call:", message.data);
            break;

          case "user-left":
            console.log("User left call:", message.data);
            handleUserLeft();
            break;

          case "agent-available":
            toast({
              title: "Agent Available",
              description: "An emergency agent is ready to talk",
            });
            break;

          case "incoming-call":
            toast({
              title: "Incoming Call",
              description: "Emergency agent is calling you",
              duration: 0,
            });
            // Dispatch custom event for UI to handle
            window.dispatchEvent(new CustomEvent("incomingCall", { 
              detail: message.data 
            }));
            break;
        }
      } catch (error) {
        console.error("Error handling WebRTC message:", error);
      }
    };

    webSocketRef.current.onerror = (error) => {
      console.error("WebRTC WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to call service",
        variant: "destructive",
      });
    };

    webSocketRef.current.onclose = () => {
      console.log("WebRTC WebSocket disconnected");
    };
  }, [toast]);

  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && webSocketRef.current) {
        webSocketRef.current.send(JSON.stringify({
          type: "ice-candidate",
          data: event.candidate,
          to: connectionId,
        }));
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote stream");
      setRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      
      if (peerConnection.connectionState === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Call Connected",
          description: "You are now connected to the emergency agent",
        });
      } else if (peerConnection.connectionState === "disconnected" || 
                 peerConnection.connectionState === "failed") {
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    return peerConnection;
  }, [connectionId, toast]);

  const startCall = useCallback(async (alertId: string, role: "agent" | "user") => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      setLocalStream(stream);

      // Initialize WebSocket
      initializeWebSocket(alertId);

      // Wait for WebSocket connection
      await new Promise((resolve) => {
        const checkConnection = () => {
          if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            resolve(void 0);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });

      // Join call room
      webSocketRef.current!.send(JSON.stringify({
        type: "join-call",
        data: { alertId, role, userId: "user-id" }, // TODO: Get actual user ID
      }));

      // Create peer connection
      peerConnectionRef.current = createPeerConnection();

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current!.addTrack(track, stream);
      });

    } catch (error) {
      console.error("Error starting call:", error);
      setIsConnecting(false);
      toast({
        title: "Call Failed",
        description: "Unable to start call. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  }, [initializeWebSocket, createPeerConnection, toast]);

  const answerCall = useCallback(async () => {
    if (!peerConnectionRef.current) return;

    try {
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      webSocketRef.current!.send(JSON.stringify({
        type: "answer",
        data: answer,
        to: connectionId,
      }));
    } catch (error) {
      console.error("Error answering call:", error);
      toast({
        title: "Answer Failed",
        description: "Unable to answer the call",
        variant: "destructive",
      });
    }
  }, [connectionId, toast]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, from: string) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      webSocketRef.current!.send(JSON.stringify({
        type: "answer",
        data: answer,
        to: from,
      }));
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }, []);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }, []);

  const handleUserLeft = useCallback(() => {
    setIsConnected(false);
    setRemoteStream(null);
    toast({
      title: "Call Ended",
      description: "The other party has left the call",
    });
  }, [toast]);

  const endCall = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
        type: "leave-call",
        data: {},
      }));
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isConnecting,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    connectionId,
  };
}
