import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Survey from "@/pages/survey";
import Dashboard from "@/pages/dashboard";
import AdminLogin from "@/pages/admin-login";
import { Loader2 } from "lucide-react";

function ProtectedDashboard() {
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setAuthState(data.isAdmin ? "authenticated" : "unauthenticated");
      })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  useEffect(() => {
    if (authState === "unauthenticated") {
      setLocation("/admin");
    }
  }, [authState, setLocation]);

  if (authState === "loading" || authState === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/survey" component={Survey} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
