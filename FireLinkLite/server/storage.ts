import {
  type User,
  type InsertUser,
  type Alert,
  type InsertAlert,
  type CallbackRequest,
  type InsertCallbackRequest,
  type CommunityResponse,
  type InsertCommunityResponse,
  type PushSubscription,
  type InsertPushSubscription,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Alert operations
  getAlert(id: string): Promise<Alert | undefined>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlertsNearLocation(lat: number, lng: number, radiusKm?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<InsertAlert>): Promise<Alert | undefined>;
  
  // Callback request operations
  getCallbackRequest(id: string): Promise<CallbackRequest | undefined>;
  getCallbackRequestsByAlert(alertId: string): Promise<CallbackRequest[]>;
  getPendingCallbackRequests(): Promise<CallbackRequest[]>;
  createCallbackRequest(request: InsertCallbackRequest): Promise<CallbackRequest>;
  updateCallbackRequest(id: string, updates: Partial<InsertCallbackRequest>): Promise<CallbackRequest | undefined>;
  
  // Community response operations
  getCommunityResponsesByAlert(alertId: string): Promise<CommunityResponse[]>;
  createCommunityResponse(response: InsertCommunityResponse): Promise<CommunityResponse>;
  
  // Push subscription operations
  getPushSubscriptionsNearLocation(lat: number, lng: number, radiusKm?: number): Promise<PushSubscription[]>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  updatePushSubscription(id: string, updates: Partial<InsertPushSubscription>): Promise<PushSubscription | undefined>;
  deletePushSubscription(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private alerts: Map<string, Alert>;
  private callbackRequests: Map<string, CallbackRequest>;
  private communityResponses: Map<string, CommunityResponse>;
  private pushSubscriptions: Map<string, PushSubscription>;

  constructor() {
    this.users = new Map();
    this.alerts = new Map();
    this.callbackRequests = new Map();
    this.communityResponses = new Map();
    this.pushSubscriptions = new Map();
    
    // Seed with default agent user
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const agentUser: User = {
      id: randomUUID(),
      username: "agent@example.com",
      password: "$2b$10$8K1p.D0U7IKyNFjEhD.M5uKaQ3q3Hgs5Gzr5YrG4X8B1vM2nP9Q8m", // ChangeMe123!
      role: "agent",
      name: "Emergency Agent",
      phone: "+1-555-0100",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(agentUser.id, agentUser);
  }

  // Haversine distance calculation helper
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Alert operations
  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.status === "active");
  }

  async getAlertsNearLocation(lat: number, lng: number, radiusKm: number = 0.2): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => {
      const distance = this.calculateDistance(lat, lng, alert.lat, alert.lng);
      return distance <= radiusKm && alert.status === "active";
    });
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      timestamp: new Date(),
      resolvedAt: null,
      assignedAgentId: null,
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: string, updates: Partial<InsertAlert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { ...alert, ...updates };
    if (updates.status === "resolved" && !updatedAlert.resolvedAt) {
      updatedAlert.resolvedAt = new Date();
    }
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // Callback request operations
  async getCallbackRequest(id: string): Promise<CallbackRequest | undefined> {
    return this.callbackRequests.get(id);
  }

  async getCallbackRequestsByAlert(alertId: string): Promise<CallbackRequest[]> {
    return Array.from(this.callbackRequests.values()).filter(req => req.alertId === alertId);
  }

  async getPendingCallbackRequests(): Promise<CallbackRequest[]> {
    return Array.from(this.callbackRequests.values()).filter(req => req.status === "pending");
  }

  async createCallbackRequest(insertRequest: InsertCallbackRequest): Promise<CallbackRequest> {
    const id = randomUUID();
    const request: CallbackRequest = {
      ...insertRequest,
      id,
      timestamp: new Date(),
      completedAt: null,
    };
    this.callbackRequests.set(id, request);
    return request;
  }

  async updateCallbackRequest(id: string, updates: Partial<InsertCallbackRequest>): Promise<CallbackRequest | undefined> {
    const request = this.callbackRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    if (updates.status === "completed" && !updatedRequest.completedAt) {
      updatedRequest.completedAt = new Date();
    }
    this.callbackRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Community response operations
  async getCommunityResponsesByAlert(alertId: string): Promise<CommunityResponse[]> {
    return Array.from(this.communityResponses.values()).filter(response => response.alertId === alertId);
  }

  async createCommunityResponse(insertResponse: InsertCommunityResponse): Promise<CommunityResponse> {
    const id = randomUUID();
    const response: CommunityResponse = {
      ...insertResponse,
      id,
      timestamp: new Date(),
    };
    this.communityResponses.set(id, response);
    return response;
  }

  // Push subscription operations
  async getPushSubscriptionsNearLocation(lat: number, lng: number, radiusKm: number = 0.2): Promise<PushSubscription[]> {
    return Array.from(this.pushSubscriptions.values()).filter(sub => {
      if (!sub.lat || !sub.lng || !sub.isActive) return false;
      const distance = this.calculateDistance(lat, lng, sub.lat, sub.lng);
      return distance <= radiusKm;
    });
  }

  async createPushSubscription(insertSubscription: InsertPushSubscription): Promise<PushSubscription> {
    const id = randomUUID();
    const subscription: PushSubscription = {
      ...insertSubscription,
      id,
      createdAt: new Date(),
    };
    this.pushSubscriptions.set(id, subscription);
    return subscription;
  }

  async updatePushSubscription(id: string, updates: Partial<InsertPushSubscription>): Promise<PushSubscription | undefined> {
    const subscription = this.pushSubscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.pushSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async deletePushSubscription(id: string): Promise<boolean> {
    return this.pushSubscriptions.delete(id);
  }
}

export const storage = new MemStorage();
