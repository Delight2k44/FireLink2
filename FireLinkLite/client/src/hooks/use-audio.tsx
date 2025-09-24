import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface AudioHook {
  isAudioEnabled: boolean;
  enableAudio: () => Promise<boolean>;
  playPanicRingtone: () => void;
  stopPanicRingtone: () => void;
  isRingtonePlaying: boolean;
}

export function useAudio(): AudioHook {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRingtonePlaying, setIsRingtonePlaying] = useState(false);
  const { toast } = useToast();

  // Check if audio is already enabled from localStorage
  useEffect(() => {
    const audioEnabled = localStorage.getItem("firelink-audio-enabled") === "true";
    setIsAudioEnabled(audioEnabled);
  }, []);

  const enableAudio = useCallback(async (): Promise<boolean> => {
    try {
      // Create a silent audio context to request permission
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Try to play the panic ringtone briefly to test permissions
      const audio = document.getElementById("panic-ringtone") as HTMLAudioElement;
      if (audio) {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
      }

      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Store permission in localStorage
      localStorage.setItem("firelink-audio-enabled", "true");
      setIsAudioEnabled(true);

      toast({
        title: "Audio Alerts Enabled",
        description: "You'll now hear emergency ringtones",
      });

      return true;
    } catch (error) {
      console.error("Failed to enable audio:", error);
      
      toast({
        title: "Audio Permission Failed",
        description: "Unable to enable audio alerts. Please check your browser settings.",
        variant: "destructive",
      });

      return false;
    }
  }, [toast]);

  const playPanicRingtone = useCallback(() => {
    if (!isAudioEnabled) {
      console.log("Audio not enabled, cannot play ringtone");
      return;
    }

    const audio = document.getElementById("panic-ringtone") as HTMLAudioElement;
    if (audio) {
      audio.loop = true;
      audio.play()
        .then(() => {
          setIsRingtonePlaying(true);
          console.log("Panic ringtone started");
        })
        .catch(error => {
          console.error("Failed to play panic ringtone:", error);
          toast({
            title: "Audio Playback Failed",
            description: "Could not play emergency ringtone",
            variant: "destructive",
          });
        });
    }
  }, [isAudioEnabled, toast]);

  const stopPanicRingtone = useCallback(() => {
    const audio = document.getElementById("panic-ringtone") as HTMLAudioElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
      setIsRingtonePlaying(false);
      console.log("Panic ringtone stopped");
    }
  }, []);

  // Auto-stop ringtone after 30 seconds for safety
  useEffect(() => {
    if (isRingtonePlaying) {
      const timeout = setTimeout(() => {
        stopPanicRingtone();
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [isRingtonePlaying, stopPanicRingtone]);

  // Listen for emergency alerts to auto-play ringtone
  useEffect(() => {
    const handleEmergencyAlert = (event: CustomEvent) => {
      if (event.detail?.playRingtone && isAudioEnabled) {
        playPanicRingtone();
        
        // Auto-stop after 10 seconds for emergency alerts
        setTimeout(() => {
          stopPanicRingtone();
        }, 10000);
      }
    };

    window.addEventListener("emergencyAlert", handleEmergencyAlert as EventListener);
    
    return () => {
      window.removeEventListener("emergencyAlert", handleEmergencyAlert as EventListener);
    };
  }, [isAudioEnabled, playPanicRingtone, stopPanicRingtone]);

  return {
    isAudioEnabled,
    enableAudio,
    playPanicRingtone,
    stopPanicRingtone,
    isRingtonePlaying,
  };
}
