import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useSocket } from "@/hooks/use-socket";
import { useAudio } from "@/hooks/use-audio";
import { apiRequest } from "@/lib/queryClient";
import { formatDistance, formatTimeAgo, getAlertStatusColor, getAlertTypeIcon, getAlertTypeColor } from "@/lib/utils";
import { Alert } from "@shared/schema";
import EmergencyPopup from "@/components/emergency-popup";
import LeafletMap from "@/components/leaflet-map";

export default function CommunityPage() {
  const [communityMode, setCommunityMode] = useState(true);
  const [emergencyPopup, setEmergencyPopup] = useState<{
    isOpen: boolean;
    alert?: Alert;
    distance?: number;
  }>({ isOpen: false });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { latitude, longitude, hasLocation } = useGeolocation();
  const { sendMessage, isConnected } = useSocket();
  const { playPanicRingtone, stopPanicRingtone } = useAudio();

  // Register client for community alerts when location is available
  useEffect(() => {
    if (isConnected && hasLocation && communityMode) {
      sendMessage({
        type: "register",
        role: "community",
        lat: latitude,
        lng: longitude,
      });
    }
  }, [isConnected, hasLocation, communityMode, latitude, longitude, sendMessage]);

  // Listen for emergency alerts
  useEffect(() => {
    const handleEmergencyAlert = (event: CustomEvent) => {
      const alertData = event.detail;
      if (alertData?.alert) {
        setEmergencyPopup({
          isOpen: true,
          alert: alertData.alert,
          distance: alertData.distance,
        });
      }
    };

    window.addEventListener("emergencyAlert", handleEmergencyAlert as EventListener);
    
    return () => {
      window.removeEventListener("emergencyAlert", handleEmergencyAlert as EventListener);
    };
  }, []);

  // Fetch nearby alerts
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["/api/alerts", latitude, longitude],
    enabled: hasLocation,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const alerts = alertsData?.alerts || [];

  // Create community response mutation
  const respondMutation = useMutation({
    mutationFn: async ({ alertId, responseType }: { alertId: string; responseType: string }) => {
      const response = await apiRequest("POST", "/api/community-responses", {
        alertId,
        responseType,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Recorded",
        description: "Your response has been sent to emergency services",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
    onError: (error) => {
      toast({
        title: "Response Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNavigate = (alert: Alert) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}`;
    window.open(googleMapsUrl, "_blank");
  };

  const handleCall = (alert: Alert) => {
    if (alert.reporterPhone) {
      window.location.href = `tel:${alert.reporterPhone}`;
    } else {
      toast({
        title: "No Phone Number",
        description: "Reporter did not provide a phone number",
        variant: "destructive",
      });
    }
  };

  const handleRespond = (alert: Alert, responseType: "en_route" | "arrived" | "assisting" = "en_route") => {
    respondMutation.mutate({ alertId: alert.id, responseType });
    setEmergencyPopup({ isOpen: false });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Community Alerts</h1>
        <p className="text-muted-foreground">Nearby emergencies within 200m</p>
      </div>

      {/* Community Status */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${communityMode ? "bg-success" : "bg-muted"}`} />
              <div>
                <p className="font-medium text-sm">
                  Community Mode {communityMode ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {communityMode ? "Receiving alerts in your area" : "Not receiving community alerts"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCommunityMode(!communityMode)}
              className="text-primary hover:text-primary/80"
              data-testid="button-toggle-community"
            >
              {communityMode ? "Disable" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Warning */}
      {!hasLocation && (
        <Card className="bg-warning/10 border-warning/20 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-warning mr-3" />
              <div>
                <p className="font-medium text-sm">Location Required</p>
                <p className="text-xs text-muted-foreground">
                  Enable location access to receive nearby emergency alerts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <div className="mb-6">
        <h2 className="font-medium mb-3">Active Alerts</h2>
        
        {isLoading && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && alerts.length === 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <i className="fas fa-shield-alt text-success text-3xl mb-2" />
              <p className="font-medium text-sm">No Active Alerts</p>
              <p className="text-xs text-muted-foreground">
                All clear in your area. Stay safe!
              </p>
            </CardContent>
          </Card>
        )}

        {alerts.map((alert) => (
          <Card key={alert.id} className="mb-3" data-testid={`alert-${alert.id}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <i className={`${getAlertTypeIcon(alert.alertType)} ${getAlertTypeColor(alert.alertType)} mr-2`} />
                  <span className="font-medium text-sm">
                    {alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)} Emergency
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getAlertStatusColor(alert.status)}`}>
                    {alert.status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(alert.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                Location: {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
              </p>
              
              {alert.message && (
                <p className="text-sm text-muted-foreground mb-2">
                  Details: {alert.message}
                </p>
              )}
              
              <p className="text-xs mb-3">
                {hasLocation && `Distance: ${formatDistance(0.15)} • `}
                {alert.reporterName ? `Reporter: ${alert.reporterName}` : "Anonymous reporter"}
              </p>
              
              {alert.status === "active" && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleNavigate(alert)}
                    className="flex-1 bg-success text-white hover:bg-success/90"
                    data-testid={`button-navigate-${alert.id}`}
                  >
                    <i className="fas fa-route mr-1" />
                    Navigate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCall(alert)}
                    disabled={!alert.reporterPhone}
                    className="flex-1 bg-primary text-white hover:bg-primary/90"
                    data-testid={`button-call-${alert.id}`}
                  >
                    <i className="fas fa-phone mr-1" />
                    Call
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(alert)}
                    disabled={respondMutation.isPending}
                    className="flex-1 bg-warning text-white hover:bg-warning/90"
                    data-testid={`button-respond-${alert.id}`}
                  >
                    <i className="fas fa-running mr-1" />
                    En Route
                  </Button>
                </div>
              )}

              {alert.status === "resolved" && (
                <div className="text-xs text-success">
                  <i className="fas fa-check-circle mr-1" />
                  Emergency resolved • EMS arrived
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map View */}
      {hasLocation && (
        <div className="mb-6">
          <h2 className="font-medium mb-3">Area Map</h2>
          <LeafletMap
            alerts={alerts}
            userLat={latitude}
            userLng={longitude}
            height="300px"
            onAlertClick={(alert) => {
              setEmergencyPopup({
                isOpen: true,
                alert,
                distance: 0.15, // Approximate distance for demo
              });
            }}
          />
        </div>
      )}

      {/* Emergency Popup */}
      <EmergencyPopup
        alert={emergencyPopup.alert}
        distance={emergencyPopup.distance}
        isOpen={emergencyPopup.isOpen}
        onClose={() => {
          setEmergencyPopup({ isOpen: false });
          stopPanicRingtone();
        }}
        onNavigate={() => {
          if (emergencyPopup.alert) {
            handleNavigate(emergencyPopup.alert);
            setEmergencyPopup({ isOpen: false });
          }
        }}
        onCall={() => {
          if (emergencyPopup.alert) {
            handleCall(emergencyPopup.alert);
            setEmergencyPopup({ isOpen: false });
          }
        }}
        onRespond={() => {
          if (emergencyPopup.alert) {
            handleRespond(emergencyPopup.alert);
          }
        }}
      />
    </div>
  );
}
