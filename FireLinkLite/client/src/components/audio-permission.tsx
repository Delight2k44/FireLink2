import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/hooks/use-audio";

export default function AudioPermissionCard() {
  const { isAudioEnabled, enableAudio } = useAudio();

  if (isAudioEnabled) {
    return (
      <Card className="bg-success/10 border-success/20 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center">
            <i className="fas fa-check-circle text-success mr-3" />
            <div>
              <p className="font-medium text-sm">Audio Alerts Enabled</p>
              <p className="text-xs text-muted-foreground">You'll now hear emergency ringtones</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-warning/10 border-warning/20 mb-6" data-testid="audio-permission-card">
      <CardContent className="p-4">
        <div className="flex items-start">
          <i className="fas fa-volume-up text-warning mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-1">Enable Alert Sounds</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Allow audio alerts to receive emergency notifications with sound
            </p>
            <Button 
              onClick={enableAudio}
              className="bg-warning text-white hover:bg-warning/90"
              data-testid="button-enable-audio"
            >
              Enable Sounds
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
