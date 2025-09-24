import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/utils";

interface EmergencyPopupProps {
  alert?: {
    id: string;
    alertType: string;
    message?: string;
    lat: number;
    lng: number;
    reporterName?: string;
  };
  distance?: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onCall: () => void;
  onRespond: () => void;
}

export default function EmergencyPopup({
  alert,
  distance = 0,
  isOpen,
  onClose,
  onNavigate,
  onCall,
  onRespond,
}: EmergencyPopupProps) {
  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 animate-slide-up" data-testid="emergency-popup">
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl p-6">
        <div className="text-center mb-4">
          <i className="fas fa-exclamation-triangle text-emergency text-4xl mb-2" />
          <h2 className="text-xl font-bold text-emergency">EMERGENCY NEARBY</h2>
          <p className="text-sm text-muted-foreground">
            Alert received • {formatDistance(distance)} away
          </p>
        </div>
        
        <div className="bg-emergency/10 border border-emergency/20 rounded-xl p-4 mb-4">
          <p className="text-sm">
            <strong>Type:</strong> {alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)}
          </p>
          <p className="text-sm">
            <strong>Location:</strong> {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
          </p>
          {alert.reporterName && (
            <p className="text-sm">
              <strong>Reporter:</strong> {alert.reporterName}
            </p>
          )}
          {alert.message && (
            <p className="text-sm">
              <strong>Message:</strong> {alert.message}
            </p>
          )}
          <p className="text-sm">
            <strong>Time:</strong> Just now
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            onClick={onNavigate}
            className="bg-success text-white hover:bg-success/90 flex flex-col py-3"
            data-testid="button-navigate"
          >
            <i className="fas fa-route mb-1" />
            Navigate
          </Button>
          <Button
            onClick={onCall}
            className="bg-primary text-white hover:bg-primary/90 flex flex-col py-3"
            data-testid="button-call"
            disabled={!alert.reporterName}
          >
            <i className="fas fa-phone mb-1" />
            Call
          </Button>
          <Button
            onClick={onRespond}
            className="bg-warning text-white hover:bg-warning/90 flex flex-col py-3"
            data-testid="button-respond"
          >
            <i className="fas fa-running mb-1" />
            I'm Coming
          </Button>
        </div>

        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full"
          data-testid="button-dismiss"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
