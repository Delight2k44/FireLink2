import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Format timestamp for display
 */
export function formatTimeAgo(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W`;
}

/**
 * Generate a short alert ID for display
 */
export function formatAlertId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get status color for alerts
 */
export function getAlertStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-emergency bg-emergency/10 border-emergency/20";
    case "in_progress":
      return "text-warning bg-warning/10 border-warning/20";
    case "resolved":
      return "text-success bg-success/10 border-success/20";
    default:
      return "text-muted-foreground bg-muted border-muted";
  }
}

/**
 * Get alert type icon
 */
export function getAlertTypeIcon(type: string): string {
  switch (type) {
    case "fire":
      return "fas fa-fire";
    case "medical":
      return "fas fa-heart";
    default:
      return "fas fa-exclamation-triangle";
  }
}

/**
 * Get alert type color
 */
export function getAlertTypeColor(type: string): string {
  switch (type) {
    case "fire":
      return "text-emergency";
    case "medical":
      return "text-emergency";
    default:
      return "text-warning";
  }
}

/**
 * Check if device supports geolocation
 */
export function supportsGeolocation(): boolean {
  return "geolocation" in navigator;
}

/**
 * Check if device supports notifications
 */
export function supportsNotifications(): boolean {
  return "Notification" in window;
}

/**
 * Check if device supports service workers
 */
export function supportsServiceWorker(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
