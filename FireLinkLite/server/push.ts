import webpush from "web-push";
import { storage } from "./storage";

// VAPID keys for web push notifications
// In production, these should be generated and stored securely
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_CONTACT = process.env.VAPID_CONTACT || "mailto:admin@firelink.example.com";

// Configure web-push only if VAPID keys are provided
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY !== "placeholder-public-key") {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("Web push notifications configured with VAPID keys");
} else {
  console.warn("VAPID keys not configured - web push notifications disabled");
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: any,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("Push notification skipped - VAPID keys not configured");
    return false;
  }

  try {
    const pushPayload = JSON.stringify(payload);
    await webpush.sendNotification(subscription, pushPayload);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

/**
 * Send emergency alert to all subscriptions within radius
 */
export async function sendEmergencyAlert(
  alertLat: number,
  alertLng: number,
  alertData: {
    id: string;
    type: string;
    message: string;
    location: string;
  },
  radiusKm: number = 0.2
): Promise<void> {
  try {
    // Get all active push subscriptions near the alert location
    const nearbySubscriptions = await storage.getPushSubscriptionsNearLocation(
      alertLat,
      alertLng,
      radiusKm
    );

    console.log(`Sending emergency alert to ${nearbySubscriptions.length} nearby devices`);

    // Prepare the push notification payload
    const payload: PushNotificationPayload = {
      title: "🚨 EMERGENCY NEARBY",
      body: `${alertData.type.toUpperCase()} alert ${Math.round(radiusKm * 1000)}m away: ${alertData.message}`,
      icon: "/icons/emergency-icon-192.png",
      badge: "/icons/emergency-badge-72.png",
      data: {
        alertId: alertData.id,
        alertType: alertData.type,
        lat: alertLat,
        lng: alertLng,
        location: alertData.location,
        playRingtone: true,
      },
      actions: [
        {
          action: "navigate",
          title: "Navigate",
          icon: "/icons/navigate-icon.png",
        },
        {
          action: "call",
          title: "Call Reporter",
          icon: "/icons/phone-icon.png",
        },
        {
          action: "respond",
          title: "I'm Coming",
          icon: "/icons/help-icon.png",
        },
      ],
    };

    // Send notifications to all nearby subscriptions
    const promises = nearbySubscriptions.map(async (sub) => {
      try {
        const subscription = JSON.parse(sub.subscription);
        await sendPushNotification(subscription, payload);
      } catch (error) {
        console.error(`Failed to send notification to subscription ${sub.id}:`, error);
        // Optionally mark subscription as inactive if it consistently fails
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Error sending emergency alerts:", error);
  }
}

/**
 * Send notification to EMS agents about new alert
 */
export async function sendAgentAlert(alertData: {
  id: string;
  type: string;
  message: string;
  location: string;
  reporterName?: string;
  reporterPhone?: string;
}): Promise<void> {
  try {
    // In a real implementation, you would have agent-specific subscriptions
    // For now, we'll log the alert for agents to see in their dashboard
    console.log("Agent Alert:", {
      title: `New ${alertData.type} Emergency`,
      body: `Location: ${alertData.location}`,
      alertId: alertData.id,
    });

    // TODO: Implement agent-specific push notifications
    // This would require tracking agent subscriptions separately
  } catch (error) {
    console.error("Error sending agent alert:", error);
  }
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribeToPush(
  userId: string,
  subscription: any,
  lat?: number,
  lng?: number
): Promise<boolean> {
  try {
    await storage.createPushSubscription({
      userId,
      subscription: JSON.stringify(subscription),
      lat,
      lng,
      isActive: true,
    });
    return true;
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return false;
  }
}

/**
 * Update user location for push notifications
 */
export async function updatePushLocation(
  userId: string,
  lat: number,
  lng: number
): Promise<boolean> {
  try {
    // Find the user's active subscription and update location
    const subscriptions = await storage.getPushSubscriptionsNearLocation(lat, lng, 999999); // Get all
    const userSubscription = subscriptions.find(sub => sub.userId === userId && sub.isActive);
    
    if (userSubscription) {
      await storage.updatePushSubscription(userSubscription.id, { lat, lng });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating push location:", error);
    return false;
  }
}

/**
 * Get VAPID public key for client
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY || "";
}
