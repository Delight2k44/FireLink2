import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LoginForm {
  username: string;
  password: string;
}

export default function AgentLoginPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    password: "",
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      // Store the token
      localStorage.setItem("agent-token", data.token);
      localStorage.setItem("agent-user", JSON.stringify(data.user));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name || data.user.username}`,
      });
      
      // Redirect to agent dashboard
      setLocation("/agent");
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleDemoLogin = () => {
    setFormData({
      username: "agent@example.com",
      password: "ChangeMe123!",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">FireLink Lite</h1>
          <p className="text-muted-foreground">EMS Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">EMS Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username or email"
                  required
                  data-testid="input-username"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo Login Button */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-center mb-3">
                <p className="text-sm text-muted-foreground">Demo Account</p>
              </div>
              <Button
                variant="outline"
                onClick={handleDemoLogin}
                className="w-full"
                data-testid="button-demo-login"
              >
                <i className="fas fa-user-shield mr-2" />
                Use Demo EMS Account
              </Button>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                <p>Username: agent@example.com</p>
                <p>Password: ChangeMe123!</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-shield-alt text-primary mr-2 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Secure Access</p>
                  <p>This portal is for authorized emergency management personnel only. All access is logged and monitored.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground"
            data-testid="link-back-to-app"
          >
            ← Back to Emergency App
          </Button>
        </div>
      </div>
    </div>
  );
}
