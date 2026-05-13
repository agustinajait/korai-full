import { useState, useMemo, useEffect } from "react";
import { INSTRUMENT } from "@/lib/instrument";
import { calcularScores, generatePlanDesdeScores } from "@/lib/korai-logic";
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare, LogOut, MapPin, ExternalLink, ArrowLeft, User, ChevronRight, Copy, Check, MessageCircle, Trash2, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4";
const CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb";

export default function Superadmin() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const role = localStorage.getItem("korai_admin_role");
    if (role !== "superadmin") setLocation("/admin");
  }, []);
  return (
    <div className="min-h-screen bg-[#070A13] text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black">KORAI Superadmin</h1>
        <p className="text-white/50">Panel en construccion</p>
        <Button onClick={() => { localStorage.removeItem("korai_admin_auth"); localStorage.removeItem("korai_admin_role"); setLocation("/admin"); }}>
          <LogOut className="w-4 h-4 mr-2" /> Salir
        </Button>
      </div>
    </div>
  );
}
