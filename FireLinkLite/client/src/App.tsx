import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

// Pages
import SOSPage from "@/pages/sos";
import CommunityPage from "@/pages/community";
import AgentPage from "@/pages/agent";
import CallPage from "@/pages/call";
import AgentLoginPage from "@/pages/agent-login";
import NotFound from "@/pages/not-found";

// Components
import NavigationTabs from "@/components/navigation-tabs";

// Hooks
import { useSocket } from "@/hooks/use-socket";
import { useGeolocation } from "@/hooks/use-geolocation";

function Router() {
  const [location] = useLocation();
  
  // Initialize socket connection
  useSocket();
  
  // Initialize geolocation
  useGeolocation();

  // Check if we're on the EMS login page
  const isAgentLogin = location === "/agent/login";
  
  return (
    <>
      {!isAgentLogin && <NavigationTabs />}
      <div className={isAgentLogin ? "" : "pt-16 pb-20"}>
        <Switch>
          <Route path="/" component={SOSPage} />
          <Route path="/community" component={CommunityPage} />
          <Route path="/agent" component={AgentPage} />
          <Route path="/agent/login" component={AgentLoginPage} />
          <Route path="/call" component={CallPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful:', registration);
          setIsServiceWorkerReady(true);
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed:', error);
        });
    }

    // Add PWA manifest
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);

    // Add meta tags for PWA
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = '#3b82f6';
    document.head.appendChild(metaThemeColor);

    const metaAppleMobileWebAppCapable = document.createElement('meta');
    metaAppleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
    metaAppleMobileWebAppCapable.content = 'yes';
    document.head.appendChild(metaAppleMobileWebAppCapable);

    return () => {
      if (manifestLink.parentNode) {
        manifestLink.parentNode.removeChild(manifestLink);
      }
      if (metaThemeColor.parentNode) {
        metaThemeColor.parentNode.removeChild(metaThemeColor);
      }
      if (metaAppleMobileWebAppCapable.parentNode) {
        metaAppleMobileWebAppCapable.parentNode.removeChild(metaAppleMobileWebAppCapable);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
