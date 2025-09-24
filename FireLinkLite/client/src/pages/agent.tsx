import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/use-socket";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeAgo, formatAlertId, getAlertTypeIcon, getAlertTypeColor } from "@/lib/utils";
import { Alert, CallbackRequest } from "@shared/schema";

export default function AgentPage() {
  const [, setLocation] = useLocation();
  const [agentInfo] = useState({
    name: "EMS Operator",
    id: "EMS-001",
    status: "On Duty",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, isConnected } = useSocket();

  // Check authentication (basic check for demo)
  useEffect(() => {
    const token = localStorage.getItem("agent-token");
    if (!token) {
      setLocation("/agent/login");
      return;
    }

    // Register as agent with WebSocket
    if (isConnected) {
      sendMessage({
        type: "register",
        role: "agent",
        userId: "agent-user-id", // Would come from auth token
      });
    }
  }, [isConnected, sendMessage, setLocation]);

  // Fetch agent stats
  const { data: statsData } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch active alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000,
  });

  // Fetch callback requests
  const { data: callbacksData, isLoading: callbacksLoading } = useQuery({
    queryKey: ["/api/callback-requests"],
    refetchInterval: 10000,
  });

  const stats = statsData?.stats || {
    activeAlerts: 0,
    inProgress: 0,
    resolved: 0,
    callbacks: 0,
  };

  const alerts = alertsData?.alerts || [];
  const callbackRequests = callbacksData?.callbackRequests || [];

  // Update alert status mutation
  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, status }: { alertId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/alerts/${alertId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Updated",
        description: "Alert status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSignOut = () => {
    localStorage.removeItem("agent-token");
    setLocation("/agent/login");
  };

  const handleCallReporter = (alert: Alert) => {
    if (alert.reporterPhone) {
      window.location.href = `tel:${alert.reporterPhone}`;
    } else {
      toast({
        title: "No Phone Available",
        description: "Reporter did not provide a phone number",
        variant: "destructive",
      });
    }
  };

  const handleDispatchUnit = (alert: Alert) => {
    updateAlertMutation.mutate({ alertId: alert.id, status: "in_progress" });
  };

  const handleViewDetails = (alert: Alert) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${alert.lat},${alert.lng}`;
    window.open(googleMapsUrl, "_blank");
  };

  const handleCallbackNow = (request: CallbackRequest) => {
    window.location.href = `tel:${request.requesterPhone}`;
  };

  // Emergency broadcast mutation
  const emergencyBroadcastMutation = useMutation({
    mutationFn: async ({ alertType, message }: { alertType: string; message: string }) => {
      const response = await apiRequest("POST", "/api/emergency-broadcast", { alertType, message });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Broadcast Sent",
        description: "Alert has been sent to all community members in the area",
      });
    },
    onError: (error) => {
      toast({
        title: "Broadcast Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePanicAlert = () => {
    emergencyBroadcastMutation.mutate({
      alertType: "general",
      message: "PANIC ALERT: EMS has issued an emergency alert for your area. Please seek shelter immediately and await further instructions."
    });
  };

  const handleEvacuationAlert = () => {
    emergencyBroadcastMutation.mutate({
      alertType: "general",
      message: "EVACUATION ALERT: Immediate evacuation required for your area. Please follow designated evacuation routes and check in with authorities."
    });
  };

  const handleShelterAlert = () => {
    emergencyBroadcastMutation.mutate({
      alertType: "general", 
      message: "SHELTER IN PLACE: Take shelter immediately. Close all windows and doors. Await further instructions from emergency services."
    });
  };

  const handleTestAlert = () => {
    emergencyBroadcastMutation.mutate({
      alertType: "general",
      message: "TEST ALERT: This is a test of the emergency broadcast system. No action is required."
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">EMS Dashboard</h1>
          <p className="text-muted-foreground">Emergency Management System</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success rounded-full mr-2" />
            <span className="text-sm font-medium">On Duty</span>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            data-testid="button-sign-out"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emergency" data-testid="stat-active-alerts">
                  {stats.activeAlerts}
                </p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
              <i className="fas fa-exclamation-triangle text-emergency" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary" data-testid="stat-in-progress">
                  {stats.inProgress}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <i className="fas fa-clock text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success" data-testid="stat-resolved">
                  {stats.resolved}
                </p>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
              </div>
              <i className="fas fa-check-circle text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning" data-testid="stat-callbacks">
                  {stats.callbacks}
                </p>
                <p className="text-sm text-muted-foreground">Pending Callbacks</p>
              </div>
              <i className="fas fa-phone-alt text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Control Center */}
      <Card className="mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Emergency Control Center</h2>
          <p className="text-sm text-muted-foreground">Send emergency broadcasts and alerts to the community</p>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Panic Alert Button */}
            <Button
              onClick={handlePanicAlert}
              disabled={emergencyBroadcastMutation.isPending}
              className="bg-emergency hover:bg-emergency/90 text-white h-20 flex flex-col items-center justify-center text-center"
              data-testid="button-panic-alert"
            >
              <i className="fas fa-exclamation-triangle text-2xl mb-1" />
              <span className="font-bold">PANIC ALERT</span>
            </Button>

            {/* Evacuation Alert */}
            <Button
              onClick={handleEvacuationAlert}
              disabled={emergencyBroadcastMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white h-20 flex flex-col items-center justify-center text-center"
              data-testid="button-evacuation-alert"
            >
              <i className="fas fa-running text-2xl mb-1" />
              <span className="font-bold">EVACUATE</span>
            </Button>

            {/* Shelter in Place */}
            <Button
              onClick={handleShelterAlert}
              disabled={emergencyBroadcastMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white h-20 flex flex-col items-center justify-center text-center"
              data-testid="button-shelter-alert"
            >
              <i className="fas fa-home text-2xl mb-1" />
              <span className="font-bold">SHELTER</span>
            </Button>

            {/* Test Alert */}
            <Button
              onClick={handleTestAlert}
              disabled={emergencyBroadcastMutation.isPending}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center text-center border-2"
              data-testid="button-test-alert"
            >
              <i className="fas fa-broadcast-tower text-2xl mb-1" />
              <span className="font-bold">TEST ALERT</span>
            </Button>
          </div>

          {/* Emergency Status Indicators */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full mr-2" />
                  <span>System Operational</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                  <span>WebSocket Connected</span>
                </div>
              </div>
              <div className="text-muted-foreground">
                {emergencyBroadcastMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2" />
                    Sending Broadcast...
                  </span>
                ) : (
                  "Ready to Send Alerts"
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Queue */}
      <Card className="mb-6">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Emergency Alert Queue</h2>
          <p className="text-sm text-muted-foreground">Incoming alerts requiring immediate attention</p>
        </div>
        
        <div className="divide-y divide-border">
          {alertsLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            </div>
          )}

          {!alertsLoading && alerts.length === 0 && (
            <div className="p-4 text-center">
              <i className="fas fa-shield-alt text-success text-3xl mb-2" />
              <p className="font-medium">No Active Alerts</p>
              <p className="text-sm text-muted-foreground">All emergencies are currently resolved</p>
            </div>
          )}

          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-muted/50" data-testid={`alert-queue-${alert.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <i className={`${getAlertTypeIcon(alert.alertType)} ${getAlertTypeColor(alert.alertType)} mr-2`} />
                    <span className="font-medium">
                      {alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)} Emergency - 
                      {alert.status === "active" ? " High Priority" : " Medium Priority"}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      alert.status === "active" 
                        ? "bg-emergency/10 text-emergency" 
                        : "bg-warning/10 text-warning"
                    }`}>
                      {alert.status === "active" ? "Critical" : "In Progress"}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Alert ID: {formatAlertId(alert.id)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <p><strong>Location:</strong> {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</p>
                    {alert.reporterName && (
                      <p><strong>Reporter:</strong> {alert.reporterName} {alert.reporterPhone && `(${alert.reporterPhone})`}</p>
                    )}
                    {alert.message && (
                      <p><strong>Description:</strong> {alert.message}</p>
                    )}
                    <p><strong>Time:</strong> {formatTimeAgo(alert.timestamp)}</p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <span>GPS: {alert.lat.toFixed(6)}°N, {alert.lng.toFixed(6)}°W</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleCallReporter(alert)}
                    disabled={!alert.reporterPhone}
                    className={alert.reporterPhone 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                    }
                    data-testid={`button-call-reporter-${alert.id}`}
                  >
                    <i className="fas fa-phone mr-1" />
                    {alert.reporterPhone ? "Call Reporter" : "No Phone"}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleDispatchUnit(alert)}
                    disabled={updateAlertMutation.isPending || alert.status !== "active"}
                    className="bg-success text-white hover:bg-success/90"
                    data-testid={`button-dispatch-${alert.id}`}
                  >
                    <i className="fas fa-route mr-1" />
                    {alert.status === "active" ? "Dispatch Unit" : "Unit Dispatched"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(alert)}
                    data-testid={`button-view-details-${alert.id}`}
                  >
                    <i className="fas fa-eye mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Callback Requests */}
      <Card>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Callback Requests</h2>
          <p className="text-sm text-muted-foreground">Users requesting scheduled callbacks</p>
        </div>
        
        <div className="divide-y divide-border">
          {callbacksLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading callbacks...</p>
            </div>
          )}

          {!callbacksLoading && callbackRequests.length === 0 && (
            <div className="p-4 text-center">
              <i className="fas fa-phone text-muted-foreground text-3xl mb-2" />
              <p className="font-medium">No Pending Callbacks</p>
              <p className="text-sm text-muted-foreground">No callback requests at this time</p>
            </div>
          )}

          {callbackRequests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-muted/50" data-testid={`callback-${request.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-medium">{request.requesterName}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{request.requesterPhone}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Related to Alert {formatAlertId(request.alertId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested: {formatTimeAgo(request.timestamp)} • 
                    Preferred time: {request.preferredTime || "ASAP"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleCallbackNow(request)}
                    className="bg-primary text-white hover:bg-primary/90"
                    data-testid={`button-call-now-${request.id}`}
                  >
                    <i className="fas fa-phone mr-1" />
                    Call Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid={`button-schedule-${request.id}`}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
