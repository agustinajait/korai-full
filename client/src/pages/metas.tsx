import { useEffect } from "react";
import { useLocation } from "wouter";

// Metas está integrado en Tu Plan (prioridades)
// Este componente redirige automáticamente
export default function Metas() {
  const [_, setLocation] = useLocation();
  useEffect(() => { setLocation("/prioridades"); }, []);
  return null;
}
