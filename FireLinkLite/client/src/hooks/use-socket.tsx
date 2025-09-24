import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocketMessage {
  type: string;
  data?: any;
  clientId?: string;
}

interface SocketHook {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  clientId: string | null;
}

export function useSocket(): SocketHook {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connect = () => {
      try {
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
        };

        socketRef.current.onmessage = (event) => {
          try {
            const message: SocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case "connected":
                setClientId(message.clientId || null);
                console.log("Client ID received:", message.clientId);
                break;

              case "alert:new":
                // Handle new emergency alert
                handleEmergencyAlert(message.data);
                break;

              case "alert:updated":
                // Handle alert status update
                console.log("Alert updated:", message.data);
                break;

              case "community:response":
                // Handle community response
                console.log("Community response:", message.data);
                break;

              case "callback:new":
                // Handle new callback request
                console.log("New callback request:", message.data);
                break;

              case "pong":
                // Heartbeat response
                break;

              default:
                console.log("Unknown message type:", message.type);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        socketRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          setClientId(null);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        socketRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        setTimeout(connect, 3000);
      }
    };

    const handleEmergencyAlert = (alertData: any) => {
      console.log("Emergency alert received:", alertData);
      
      toast({
        title: "🚨 EMERGENCY NEARBY",
        description: `${alertData.alert.alertType.toUpperCase()} alert ${Math.round((alertData.distance || 0) * 1000)}m away`,
        duration: 0, // Don't auto-dismiss
      });

      // Play ringtone if enabled and permission granted
      if (alertData.playRingtone) {
        const audio = document.getElementById("panic-ringtone") as HTMLAudioElement;
        if (audio) {
          audio.play().catch(error => {
            console.log("Could not play ringtone:", error);
          });
          
          // Stop ringtone after 10 seconds
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 10000);
        }
      }

      // Dispatch custom event for components to handle
      const event = new CustomEvent("emergencyAlert", { 
        detail: alertData 
      });
      window.dispatchEvent(event);
    };

    connect();

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: "ping" });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [toast]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    clientId,
  };
}
