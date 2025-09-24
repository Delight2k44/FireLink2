import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useToast } from "@/hooks/use-toast";

interface CallState {
  phase: "waiting" | "incoming" | "active" | "ended";
  duration: number;
  agentInfo: {
    name: string;
    id: string;
    role: string;
  } | null;
}

export default function CallPage() {
  const [callState, setCallState] = useState<CallState>({
    phase: "waiting",
    duration: 0,
    agentInfo: null,
  });

  const { toast } = useToast();
  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isConnecting,
    startCall,
    answerCall,
    endCall,
    toggleMute,
  } = useWebRTC();

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState.phase === "active" && isConnected) {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.phase, isConnected]);

  // Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = (event: CustomEvent) => {
      const { agentId, alertId } = event.detail;
      setCallState({
        phase: "incoming",
        duration: 0,
        agentInfo: {
          name: "Agent Sarah Johnson",
          id: agentId,
          role: "EMS Coordinator",
        },
      });
    };

    window.addEventListener("incomingCall", handleIncomingCall as EventListener);
    
    return () => {
      window.removeEventListener("incomingCall", handleIncomingCall as EventListener);
    };
  }, []);

  // Handle WebRTC connection state changes
  useEffect(() => {
    if (isConnected && callState.phase !== "active") {
      setCallState(prev => ({
        ...prev,
        phase: "active",
        duration: 0,
      }));
    }
  }, [isConnected, callState.phase]);

  const handleAnswerCall = async () => {
    try {
      await answerCall();
      setCallState(prev => ({ ...prev, phase: "active" }));
    } catch (error) {
      toast({
        title: "Call Failed",
        description: "Unable to answer the call",
        variant: "destructive",
      });
    }
  };

  const handleRejectCall = () => {
    endCall();
    setCallState({
      phase: "ended",
      duration: callState.duration,
      agentInfo: callState.agentInfo,
    });
  };

  const handleEndCall = () => {
    endCall();
    setCallState(prev => ({
      ...prev,
      phase: "ended",
    }));
  };

  const handleRequestAnotherCall = async () => {
    try {
      // Start a new call for emergency assistance
      await startCall("demo-alert-id", "user");
      setCallState({
        phase: "waiting",
        duration: 0,
        agentInfo: null,
      });
    } catch (error) {
      toast({
        title: "Call Request Failed",
        description: "Unable to request a new call",
        variant: "destructive",
      });
    }
  };

  const handleReturnHome = () => {
    window.location.href = "/";
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Waiting State
  if (callState.phase === "waiting") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center">
          <div className="w-32 h-32 bg-muted/50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-headset text-muted-foreground text-4xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Voice Call</h2>
          <p className="text-muted-foreground mb-8">Ready to connect with emergency services</p>

          <div className="space-y-4">
            <Button
              onClick={handleRequestAnotherCall}
              disabled={isConnecting}
              className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90"
              data-testid="button-request-call"
            >
              {isConnecting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-phone mr-2" />
                  Request Emergency Call
                </>
              )}
            </Button>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2 text-sm">How it works</h3>
                <div className="text-xs text-muted-foreground text-left space-y-1">
                  <p>• Click "Request Emergency Call" to connect</p>
                  <p>• An EMS agent will join the call</p>
                  <p>• Speak clearly about your emergency</p>
                  <p>• Stay on the line until help arrives</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Incoming Call State
  if (callState.phase === "incoming") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center" data-testid="incoming-call">
          <div className="w-32 h-32 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-headset text-primary text-4xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
          <p className="text-lg font-medium" data-testid="caller-name">
            {callState.agentInfo?.name || "EMS Agent"}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {callState.agentInfo?.role || "Emergency Coordinator"}
          </p>

          <div className="flex justify-center space-x-8">
            <Button
              onClick={handleRejectCall}
              className="w-16 h-16 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90"
              data-testid="button-reject-call"
            >
              <i className="fas fa-phone-slash text-xl" />
            </Button>
            <Button
              onClick={handleAnswerCall}
              className="w-16 h-16 bg-success text-white rounded-full flex items-center justify-center hover:bg-success/90"
              data-testid="button-answer-call"
            >
              <i className="fas fa-phone text-xl" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Call State
  if (callState.phase === "active") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center" data-testid="active-call">
          <div className="w-32 h-32 bg-success/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-user-tie text-success text-4xl" />
          </div>
          <h2 className="text-xl font-bold mb-2" data-testid="agent-name">
            {callState.agentInfo?.name || "Emergency Agent"}
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            {callState.agentInfo?.role || "EMS Coordinator"}
          </p>
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-success font-medium">Connected</span>
          </div>

          {/* Call Duration */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-3xl font-mono font-bold" data-testid="call-duration">
                  {formatDuration(callState.duration)}
                </p>
                <p className="text-sm text-muted-foreground">Call Duration</p>
              </div>
            </CardContent>
          </Card>

          {/* Call Quality Indicator */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fas fa-wifi text-success mr-2" />
                  <span className="text-sm font-medium">Call Quality</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-6 bg-success rounded" />
                  <div className="w-2 h-5 bg-success rounded" />
                  <div className="w-2 h-4 bg-success rounded" />
                  <div className="w-2 h-3 bg-muted rounded" />
                  <div className="w-2 h-2 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Controls */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Button
              onClick={toggleMute}
              variant="outline"
              className={`p-4 text-center ${isMuted ? "bg-destructive text-white" : ""}`}
              data-testid="button-mute"
            >
              <div>
                <i className={`fas ${isMuted ? "fa-microphone-slash" : "fa-microphone"} text-xl mb-2`} />
                <p className="text-xs">{isMuted ? "Unmute" : "Mute"}</p>
              </div>
            </Button>
            <Button variant="outline" className="p-4 text-center" data-testid="button-speaker">
              <div>
                <i className="fas fa-volume-up text-xl mb-2" />
                <p className="text-xs">Speaker</p>
              </div>
            </Button>
            <Button variant="outline" className="p-4 text-center" data-testid="button-hold">
              <div>
                <i className="fas fa-pause text-xl mb-2" />
                <p className="text-xs">Hold</p>
              </div>
            </Button>
          </div>

          {/* End Call Button */}
          <Button
            onClick={handleEndCall}
            className="w-16 h-16 bg-destructive text-white rounded-full mx-auto flex items-center justify-center hover:bg-destructive/90 mb-6"
            data-testid="button-end-call"
          >
            <i className="fas fa-phone-slash text-xl" />
          </Button>

          {/* Emergency Info Shared */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 text-sm">Information Shared</h3>
              <div className="text-xs text-muted-foreground space-y-1 text-left">
                <p><strong>Emergency Type:</strong> General</p>
                <p><strong>Your Location:</strong> Shared with agent</p>
                <p><strong>Call Time:</strong> {formatDuration(callState.duration)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Call Ended State
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center" data-testid="call-ended">
        <div className="w-32 h-32 bg-muted/50 rounded-full mx-auto mb-4 flex items-center justify-center">
          <i className="fas fa-phone-slash text-muted-foreground text-4xl" />
        </div>
        <h2 className="text-xl font-bold mb-2">Call Ended</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Duration: {formatDuration(callState.duration)}
        </p>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 text-sm">Call Summary</h3>
            <div className="text-xs text-muted-foreground text-left space-y-2">
              <p>✓ Emergency details confirmed</p>
              <p>✓ Help has been dispatched</p>
              <p>✓ Instructions provided</p>
              <p>✓ Follow-up available if needed</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleRequestAnotherCall}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90"
            data-testid="button-request-another-call"
          >
            Request Another Call
          </Button>
          <Button
            onClick={handleReturnHome}
            variant="outline"
            className="w-full py-3 rounded-xl font-medium"
            data-testid="button-return-home"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
