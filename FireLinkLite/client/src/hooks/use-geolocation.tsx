import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });
  
  const { toast } = useToast();

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported",
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = "Unable to get location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [toast]);

  const setManualLocation = useCallback((latitude: number, longitude: number) => {
    setState({
      latitude,
      longitude,
      error: null,
      loading: false,
    });
  }, []);

  // Automatically get location on mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    ...state,
    getCurrentPosition,
    setManualLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}
