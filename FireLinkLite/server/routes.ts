import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { createAlertSchema, insertCallbackRequestSchema } from "@shared/schema";
import { authenticateToken, requireRole, loginHandler, registerHandler, type AuthenticatedRequest } from "./auth";
import { WebRTCSignalingServer } from "./webrtc";
import { sendEmergencyAlert, sendAgentAlert, subscribeToPush, updatePushLocation, getVapidPublicKey } from "./push";
import { calculateDistance } from "./haversine";

// Connected clients for real-time updates
const connectedClients = new Map<string, { socket: WebSocket; userId?: string; role?: string; lat?: number; lng?: number }>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize WebRTC signaling server
  const webrtcServer = new WebRTCSignalingServer(httpServer);

  // Initialize WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket, request) => {
    const clientId = generateClientId();
    console.log(`Client connected: ${clientId}`);

    connectedClients.set(clientId, { socket });

    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(clientId, message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    socket.on("close", () => {
      console.log(`Client disconnected: ${clientId}`);
      connectedClients.delete(clientId);
    });

    socket.on("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      connectedClients.delete(clientId);
    });

    // Send welcome message
    sendToClient(clientId, { type: "connected", clientId });
  });

  // Authentication routes
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/register", registerHandler);

  // Emergency alert routes
  app.post("/api/alerts", async (req, res) => {
    try {
      // Validate the request data
      const validatedData = createAlertSchema.parse(req.body);

      // Create the alert
      const alert = await storage.createAlert(validatedData);

      console.log(`Emergency alert created: ${alert.id} at ${alert.lat}, ${alert.lng}`);

      // Find nearby community members and send real-time notifications
      const nearbyClients = findClientsWithinRadius(alert.lat, alert.lng, 0.2); // 200m radius
      
      // Send real-time alert to nearby clients
      nearbyClients.forEach(client => {
        sendToClient(client.id, {
          type: "alert:new",
          data: {
            alert,
            distance: calculateDistance(alert.lat, alert.lng, client.lat!, client.lng!),
            playRingtone: true,
          },
        });
      });

      // Send push notifications to nearby devices
      await sendEmergencyAlert(alert.lat, alert.lng, {
        id: alert.id,
        type: alert.alertType,
        message: alert.message || "Emergency alert",
        location: `${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}`,
      });

      // Notify EMS agents
      notifyAgents({
        type: "alert:new",
        data: alert,
      });

      await sendAgentAlert({
        id: alert.id,
        type: alert.alertType,
        message: alert.message || "Emergency alert",
        location: `${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}`,
        reporterName: alert.reporterName,
        reporterPhone: alert.reporterPhone,
      });

      res.status(201).json({
        success: true,
        alert: {
          id: alert.id,
          timestamp: alert.timestamp,
          status: alert.status,
        },
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(400).json({ message: "Invalid alert data", error: error.message });
    }
  });

  // Get alerts (for community and agents)
  app.get("/api/alerts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { lat, lng, radius = "0.2" } = req.query;

      let alerts;
      if (lat && lng) {
        // Get alerts near location
        alerts = await storage.getAlertsNearLocation(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else {
        // Get all active alerts (for agents)
        alerts = await storage.getActiveAlerts();
      }

      res.json({ alerts });
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Error fetching alerts" });
    }
  });

  // Update alert status (agents only)
  app.patch("/api/alerts/:id", authenticateToken, requireRole("agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status, assignedAgentId } = req.body;

      const updatedAlert = await storage.updateAlert(id, {
        status,
        assignedAgentId: assignedAgentId || req.user!.id,
      });

      if (!updatedAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Notify connected clients about the update
      broadcastToAll({
        type: "alert:updated",
        data: updatedAlert,
      });

      res.json({ alert: updatedAlert });
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ message: "Error updating alert" });
    }
  });

  // Callback request routes
  app.post("/api/callback-requests", async (req, res) => {
    try {
      const validatedData = insertCallbackRequestSchema.parse(req.body);
      const callbackRequest = await storage.createCallbackRequest(validatedData);

      // Notify agents about new callback request
      notifyAgents({
        type: "callback:new",
        data: callbackRequest,
      });

      res.status(201).json({ callbackRequest });
    } catch (error) {
      console.error("Error creating callback request:", error);
      res.status(400).json({ message: "Invalid callback request data" });
    }
  });

  // Get callback requests (agents only)
  app.get("/api/callback-requests", authenticateToken, requireRole("agent"), async (req, res) => {
    try {
      const pendingRequests = await storage.getPendingCallbackRequests();
      res.json({ callbackRequests: pendingRequests });
    } catch (error) {
      console.error("Error fetching callback requests:", error);
      res.status(500).json({ message: "Error fetching callback requests" });
    }
  });

  // Community response routes
  app.post("/api/community-responses", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { alertId, responseType } = req.body;
      
      const response = await storage.createCommunityResponse({
        alertId,
        userId: req.user!.id,
        responseType,
      });

      // Notify all clients about the community response
      broadcastToAll({
        type: "community:response",
        data: response,
      });

      res.status(201).json({ response });
    } catch (error) {
      console.error("Error creating community response:", error);
      res.status(500).json({ message: "Error creating community response" });
    }
  });

  // Push notification routes
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, lat, lng, userId } = req.body;
      
      const success = await subscribeToPush(userId, subscription, lat, lng);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ success: false, message: "Failed to subscribe" });
      }
    } catch (error) {
      console.error("Error subscribing to push:", error);
      res.status(500).json({ success: false, message: "Error subscribing to push" });
    }
  });

  app.post("/api/push/update-location", async (req, res) => {
    try {
      const { userId, lat, lng } = req.body;
      
      const success = await updatePushLocation(userId, lat, lng);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ success: false, message: "Failed to update location" });
      }
    } catch (error) {
      console.error("Error updating push location:", error);
      res.status(500).json({ success: false, message: "Error updating push location" });
    }
  });

  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  // Agent dashboard stats
  app.get("/api/stats", authenticateToken, requireRole("agent"), async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      const callbackRequests = await storage.getPendingCallbackRequests();
      
      const stats = {
        activeAlerts: alerts.filter(a => a.status === "active").length,
        inProgress: alerts.filter(a => a.status === "in_progress").length,
        resolved: 0, // Would need to implement date filtering for "today"
        callbacks: callbackRequests.length,
      };

      res.json({ stats });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // WebSocket message handlers
  function handleWebSocketMessage(clientId: string, message: any) {
    const client = connectedClients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "register":
        // Register client with role and location
        client.userId = message.userId;
        client.role = message.role;
        client.lat = message.lat;
        client.lng = message.lng;
        console.log(`Client ${clientId} registered as ${message.role} at ${message.lat}, ${message.lng}`);
        break;

      case "location-update":
        // Update client location
        client.lat = message.lat;
        client.lng = message.lng;
        break;

      case "ping":
        // Heartbeat
        sendToClient(clientId, { type: "pong" });
        break;

      default:
        console.log(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  // Helper functions
  function generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  function sendToClient(clientId: string, message: any) {
    const client = connectedClients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  function broadcastToAll(message: any) {
    connectedClients.forEach((client, clientId) => {
      sendToClient(clientId, message);
    });
  }

  function notifyAgents(message: any) {
    connectedClients.forEach((client, clientId) => {
      if (client.role === "agent") {
        sendToClient(clientId, message);
      }
    });
  }

  function findClientsWithinRadius(lat: number, lng: number, radiusKm: number) {
    const nearbyClients: Array<{ id: string; lat: number; lng: number }> = [];
    
    connectedClients.forEach((client, clientId) => {
      if (client.lat && client.lng && client.role === "community") {
        const distance = calculateDistance(lat, lng, client.lat, client.lng);
        if (distance <= radiusKm) {
          nearbyClients.push({ id: clientId, lat: client.lat, lng: client.lng });
        }
      }
    });

    return nearbyClients;
  }

  return httpServer;
}
