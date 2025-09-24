import { useEffect, useRef } from "react";
import { Alert } from "@shared/schema";

// Declare Leaflet global variable
declare global {
  interface Window {
    L: any;
  }
}

interface LeafletMapProps {
  alerts: Alert[];
  userLat?: number;
  userLng?: number;
  height?: string;
  onAlertClick?: (alert: Alert) => void;
}

export default function LeafletMap({
  alerts,
  userLat,
  userLng,
  height = "300px",
  onAlertClick,
}: LeafletMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Leaflet CSS and JS if not already loaded
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      // Default to San Francisco if no user location
      const defaultLat = userLat || 37.7749;
      const defaultLng = userLng || -122.4194;

      // Initialize map
      mapRef.current = window.L.map(mapContainerRef.current).setView(
        [defaultLat, defaultLng],
        15
      );

      // Add tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Add user location marker if available
      if (userLat && userLng) {
        const userIcon = window.L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        window.L.marker([userLat, userLng], { icon: userIcon })
          .addTo(mapRef.current)
          .bindPopup("Your location");
      }

      updateMarkers();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    updateMarkers();
  }, [alerts]);

  const updateMarkers = () => {
    if (!mapRef.current || !window.L) return;

    // Clear existing alert markers (keep user marker)
    mapRef.current.eachLayer((layer: any) => {
      if (layer.options?.alertId) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Add alert markers
    alerts.forEach((alert) => {
      const getAlertIcon = (alertType: string, status: string) => {
        let color = "#ef4444"; // red for emergency
        let icon = "exclamation-triangle";

        if (alertType === "fire") {
          icon = "fire";
          color = "#ef4444";
        } else if (alertType === "medical") {
          icon = "heart";
          color = "#ef4444";
        }

        if (status === "resolved") {
          color = "#22c55e"; // green
        } else if (status === "in_progress") {
          color = "#f59e0b"; // orange
        }

        return window.L.divIcon({
          className: 'alert-marker',
          html: `<div style="background: ${color}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="fas fa-${icon}"></i></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      };

      const marker = window.L.marker([alert.lat, alert.lng], {
        icon: getAlertIcon(alert.alertType, alert.status),
        alertId: alert.id,
      }).addTo(mapRef.current);

      // Add popup with alert details
      const popupContent = `
        <div>
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">
            ${alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)} Emergency
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px;">
            <strong>Status:</strong> ${alert.status}
          </p>
          ${alert.message ? `<p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Details:</strong> ${alert.message}</p>` : ''}
          ${alert.reporterName ? `<p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Reporter:</strong> ${alert.reporterName}</p>` : ''}
          <p style="margin: 0; font-size: 12px;">
            <strong>Time:</strong> ${new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Handle click event
      if (onAlertClick) {
        marker.on('click', () => onAlertClick(alert));
      }
    });

    // Fit map to show all markers if there are alerts
    if (alerts.length > 0) {
      const group = new window.L.featureGroup(
        alerts.map(alert => window.L.marker([alert.lat, alert.lng]))
      );
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div 
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="map-container border border-border rounded-lg"
      data-testid="leaflet-map"
    />
  );
}
