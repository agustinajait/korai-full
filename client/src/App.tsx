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
import Prioridades from "@/pages/prioridades";
import Metas from "@/pages/metas";
import Confirmar from "@/pages/confirmar";
import Privacidad from "@/pages/privacidad";
import Superadmin from "@/pages/superadmin";
import { Loader2 } from "lucide-react";

function ProtectedDashboard() {
  const [, setLocation] = useLocation();
  
  const isAuth = localStorage.getItem("korai_admin_auth") === "true";
  
  if (!isAuth) {
    setLocation("/admin");
    return null;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/survey" component={Survey} />
      <Route path="/prioridades" component={Prioridades} />
      <Route path="/metas" component={Metas} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/confirmar" component={Confirmar} />
      <Route path="/privacidad" component={Privacidad} />
      <Route path="/superadmin" component={Superadmin} />
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




