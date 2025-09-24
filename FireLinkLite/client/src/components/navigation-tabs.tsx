import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "sos", path: "/", icon: "fas fa-exclamation-triangle", label: "SOS" },
  { id: "community", path: "/community", icon: "fas fa-users", label: "Community" },
  { id: "agent", path: "/agent", icon: "fas fa-headset", label: "EMS" },
  { id: "call", path: "/call", icon: "fas fa-phone", label: "Call" },
];

export default function NavigationTabs() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50">
      <div className="flex justify-center">
        <div className="flex space-x-1 p-2">
          {tabs.map((tab) => {
            const isActive = location === tab.path;
            
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-testid={`tab-${tab.id}`}
              >
                <i className={`${tab.icon} mr-1`} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
