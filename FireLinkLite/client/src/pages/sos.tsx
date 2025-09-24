import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useSocket } from "@/hooks/use-socket";
import { apiRequest } from "@/lib/queryClient";
import { formatCoordinates } from "@/lib/utils";
import AudioPermissionCard from "@/components/audio-permission";

interface AlertFormData {
  reporterName: string;
  reporterPhone: string;
  message: string;
  alertType: "fire" | "medical" | "general";
}

export default function SOSPage() {
  const [alertSent, setAlertSent] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({
    reporterName: "",
    reporterPhone: "",
    message: "",
    alertType: "general",
  });
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" });
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { latitude, longitude, loading: locationLoading, error: locationError, getCurrentPosition, setManualLocation: setGeoLocation, hasLocation } = useGeolocation();
  const { sendMessage, isConnected } = useSocket();

  const sendAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await apiRequest("POST", "/api/alerts", alertData);
      return response.json();
    },
    onSuccess: (data) => {
      setAlertSent(true);
      toast({
        title: "Alert Sent Successfully",
        description: `Help is being notified • Alert ID: ${data.alert.id.slice(-6).toUpperCase()}`,
      });

      // Register with WebSocket for real-time updates about this alert
      if (isConnected) {
        sendMessage({
          type: "register",
          role: "user",
          lat: useManualLocation ? parseFloat(manualLocation.lat) : latitude,
          lng: useManualLocation ? parseFloat(manualLocation.lng) : longitude,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Alert Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSOSClick = async () => {
    if (alertSent || sendAlertMutation.isPending) return;

    // Determine which location to use
    let alertLat: number;
    let alertLng: number;

    if (useManualLocation) {
      if (!manualLocation.lat || !manualLocation.lng) {
        toast({
          title: "Location Required",
          description: "Please enter your location or allow GPS access",
          variant: "destructive",
        });
        return;
      }
      alertLat = parseFloat(manualLocation.lat);
      alertLng = parseFloat(manualLocation.lng);
    } else if (latitude && longitude) {
      alertLat = latitude;
      alertLng = longitude;
    } else {
      toast({
        title: "Location Required",
        description: "Unable to determine your location. Please enable GPS or enter manually.",
        variant: "destructive",
      });
      return;
    }

    // Prepare alert data
    const alertData = {
      lat: alertLat,
      lng: alertLng,
      reporterName: formData.reporterName || undefined,
      reporterPhone: formData.reporterPhone || undefined,
      message: formData.message || undefined,
      alertType: formData.alertType,
    };

    sendAlertMutation.mutate(alertData);
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
        variant: "destructive",
      });
      return;
    }

    setGeoLocation(lat, lng);
    setUseManualLocation(true);
    toast({
      title: "Location Set",
      description: `Location set to ${formatCoordinates(lat, lng)}`,
    });
  };

  const handleSaveOptionalInfo = () => {
    setInfoSaved(true);
    toast({
      title: "Information Saved",
      description: "Your optional information has been saved and will be included with any emergency alerts.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">FireLink Lite</h1>
        <p className="text-muted-foreground">Emergency Alert System</p>
      </div>

      {/* Location Status */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-map-marker-alt text-primary mr-3" />
              <div>
                <p className="font-medium text-sm">Current Location</p>
                <p className="text-xs text-muted-foreground" data-testid="text-location">
                  {locationLoading && "Detecting..."}
                  {locationError && "Location unavailable"}
                  {hasLocation && !useManualLocation && formatCoordinates(latitude!, longitude!)}
                  {useManualLocation && formatCoordinates(parseFloat(manualLocation.lat), parseFloat(manualLocation.lng))}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={getCurrentPosition}
              disabled={locationLoading}
              className="text-primary hover:text-primary/80"
              data-testid="button-update-location"
            >
              {locationLoading ? "Updating..." : "Update"}
            </Button>
          </div>
          
          {/* Manual Location Entry */}
          {(!hasLocation || locationError) && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Enter Location Manually</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input
                  type="number"
                  placeholder="Latitude"
                  value={manualLocation.lat}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                  data-testid="input-latitude"
                />
                <Input
                  type="number"
                  placeholder="Longitude"
                  value={manualLocation.lng}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                  data-testid="input-longitude"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualLocationSubmit}
                disabled={!manualLocation.lat || !manualLocation.lng}
                className="w-full"
                data-testid="button-set-manual-location"
              >
                Set Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Permission Card */}
      <AudioPermissionCard />

      {/* Main SOS Button */}
      <div className="text-center mb-8">
        <Button
          onClick={handleSOSClick}
          disabled={alertSent || sendAlertMutation.isPending || (!hasLocation && !useManualLocation)}
          className={`
            w-64 h-64 rounded-full text-2xl font-bold transition-all duration-200 active:scale-95
            ${alertSent 
              ? "bg-success hover:bg-success/90 text-white" 
              : "bg-emergency hover:bg-emergency/90 text-white emergency-button animate-pulse-emergency"
            }
          `}
          data-testid="button-sos"
        >
          <div>
            {sendAlertMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin text-4xl mb-2" />
                <div className="text-xl font-black">Sending...</div>
                <div className="text-sm font-normal opacity-90">Getting Location</div>
              </>
            ) : alertSent ? (
              <>
                <i className="fas fa-check-circle text-4xl mb-2" />
                <div className="text-2xl font-black">SENT</div>
                <div className="text-sm font-normal opacity-90">Help Notified</div>
              </>
            ) : (
              <>
                <i className="fas fa-exclamation-triangle text-4xl mb-2" />
                <div className="text-3xl font-black">SOS</div>
                <div className="text-sm font-normal opacity-90">Press for Emergency</div>
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Optional Information Form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Optional Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Emergency Type</label>
              <select
                value={formData.alertType}
                onChange={(e) => setFormData(prev => ({ ...prev, alertType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                data-testid="select-alert-type"
              >
                <option value="general">General Emergency</option>
                <option value="fire">Fire Emergency</option>
                <option value="medical">Medical Emergency</option>
              </select>
            </div>
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={formData.reporterName}
              onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
              data-testid="input-reporter-name"
            />
            <Input
              type="tel"
              placeholder="Phone number (optional)"
              value={formData.reporterPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, reporterPhone: e.target.value }))}
              data-testid="input-reporter-phone"
            />
            <Textarea
              placeholder="Brief description of emergency (optional)"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="h-20 resize-none"
              data-testid="textarea-message"
            />
            <Button 
              onClick={handleSaveOptionalInfo}
              variant={infoSaved ? "default" : "outline"}
              className={`w-full mt-3 ${infoSaved ? "bg-success hover:bg-success/90 text-white" : ""}`}
              data-testid="button-save-info"
            >
              {infoSaved ? (
                <>
                  <i className="fas fa-check mr-2" />
                  Information Saved
                </>
              ) : (
                "Save Information"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {alertSent && (
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-success mr-3" />
              <div>
                <p className="font-medium text-sm">Alert Sent Successfully</p>
                <p className="text-xs text-muted-foreground">
                  Help is being notified • Check the Call tab to connect with EMS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden audio element for panic ringtone */}
      <audio id="panic-ringtone" preload="auto">
        <source src="/audio/panic.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
