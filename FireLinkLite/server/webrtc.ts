import { WebSocketServer, WebSocket } from "ws";
import { type Server } from "http";

interface WebRTCConnection {
  id: string;
  socket: WebSocket;
  role: "agent" | "user";
  alertId?: string;
  userId?: string;
  isConnected: boolean;
}

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "join-call" | "leave-call";
  data: any;
  from?: string;
  to?: string;
  alertId?: string;
}

export class WebRTCSignalingServer {
  private connections: Map<string, WebRTCConnection> = new Map();
  private activeRooms: Map<string, Set<string>> = new Map(); // alertId -> Set of connection IDs

  constructor(server: Server) {
    const wss = new WebSocketServer({ server, path: "/webrtc" });

    wss.on("connection", (socket, request) => {
      const connectionId = this.generateConnectionId();
      console.log(`WebRTC connection established: ${connectionId}`);

      // Initialize connection
      const connection: WebRTCConnection = {
        id: connectionId,
        socket,
        role: "user", // Default role, will be updated
        isConnected: true,
      };

      this.connections.set(connectionId, connection);

      // Handle incoming messages
      socket.on("message", (data) => {
        try {
          const message: SignalingMessage = JSON.parse(data.toString());
          this.handleSignalingMessage(connectionId, message);
        } catch (error) {
          console.error("Error parsing WebRTC message:", error);
        }
      });

      // Handle connection close
      socket.on("close", () => {
        console.log(`WebRTC connection closed: ${connectionId}`);
        this.handleConnectionClose(connectionId);
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`WebRTC connection error for ${connectionId}:`, error);
        this.handleConnectionClose(connectionId);
      });

      // Send connection ID to client
      this.sendMessage(connectionId, {
        type: "connection-established",
        data: { connectionId },
      });
    });
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private handleSignalingMessage(fromId: string, message: SignalingMessage) {
    const connection = this.connections.get(fromId);
    if (!connection) return;

    switch (message.type) {
      case "join-call":
        this.handleJoinCall(fromId, message);
        break;

      case "offer":
        this.handleOffer(fromId, message);
        break;

      case "answer":
        this.handleAnswer(fromId, message);
        break;

      case "ice-candidate":
        this.handleIceCandidate(fromId, message);
        break;

      case "leave-call":
        this.handleLeaveCall(fromId, message);
        break;

      default:
        console.log(`Unknown WebRTC message type: ${message.type}`);
    }
  }

  private handleJoinCall(connectionId: string, message: SignalingMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { alertId, role, userId } = message.data;

    // Update connection info
    connection.alertId = alertId;
    connection.role = role;
    connection.userId = userId;

    // Add to room
    if (!this.activeRooms.has(alertId)) {
      this.activeRooms.set(alertId, new Set());
    }
    this.activeRooms.get(alertId)!.add(connectionId);

    console.log(`${role} ${connectionId} joined call for alert ${alertId}`);

    // Notify others in the room
    this.broadcastToRoom(alertId, {
      type: "user-joined",
      data: { connectionId, role, userId },
    }, connectionId);

    // If this is an agent joining, and there's a user waiting, initiate the call
    if (role === "agent") {
      const room = this.activeRooms.get(alertId);
      if (room) {
        const userConnection = Array.from(room).find(id => {
          const conn = this.connections.get(id);
          return conn?.role === "user";
        });

        if (userConnection) {
          // Notify the user that an agent is available
          this.sendMessage(userConnection, {
            type: "agent-available",
            data: { agentId: connectionId },
          });
        }
      }
    }
  }

  private handleOffer(fromId: string, message: SignalingMessage) {
    const { to } = message;
    if (to && this.connections.has(to)) {
      this.sendMessage(to, {
        type: "offer",
        data: message.data,
        from: fromId,
      });
    }
  }

  private handleAnswer(fromId: string, message: SignalingMessage) {
    const { to } = message;
    if (to && this.connections.has(to)) {
      this.sendMessage(to, {
        type: "answer",
        data: message.data,
        from: fromId,
      });
    }
  }

  private handleIceCandidate(fromId: string, message: SignalingMessage) {
    const { to } = message;
    if (to && this.connections.has(to)) {
      this.sendMessage(to, {
        type: "ice-candidate",
        data: message.data,
        from: fromId,
      });
    }
  }

  private handleLeaveCall(connectionId: string, message: SignalingMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.alertId) return;

    const alertId = connection.alertId;
    
    // Remove from room
    const room = this.activeRooms.get(alertId);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        this.activeRooms.delete(alertId);
      }
    }

    // Notify others in the room
    this.broadcastToRoom(alertId, {
      type: "user-left",
      data: { connectionId, role: connection.role },
    }, connectionId);

    console.log(`${connection.role} ${connectionId} left call for alert ${alertId}`);
  }

  private handleConnectionClose(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      if (connection.alertId) {
        this.handleLeaveCall(connectionId, { type: "leave-call", data: {} });
      }
      this.connections.delete(connectionId);
    }
  }

  private sendMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
    }
  }

  private broadcastToRoom(alertId: string, message: any, excludeId?: string) {
    const room = this.activeRooms.get(alertId);
    if (!room) return;

    room.forEach(connectionId => {
      if (connectionId !== excludeId) {
        this.sendMessage(connectionId, message);
      }
    });
  }

  // Public methods for external use
  public initiateAgentCall(alertId: string, agentId: string): boolean {
    const room = this.activeRooms.get(alertId);
    if (!room) return false;

    // Find user connection in the room
    const userConnectionId = Array.from(room).find(id => {
      const conn = this.connections.get(id);
      return conn?.role === "user";
    });

    if (!userConnectionId) return false;

    // Send call initiation to user
    this.sendMessage(userConnectionId, {
      type: "incoming-call",
      data: { agentId, alertId },
    });

    return true;
  }

  public getActiveConnections(): number {
    return this.connections.size;
  }

  public getActiveRooms(): string[] {
    return Array.from(this.activeRooms.keys());
  }
}
