import { useState, useMemo } from "react";
import { useReports } from "@/hooks/use-reports";
import { INSTRUMENT } from "@/lib/instrument";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, TrendingUp, Users, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#22c55e"
};

export default function Dashboard() {
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [days, setDays] = useState(30);
  const { data: reports, isLoading, error } = useReports({ city: cityFilter === "all" ? undefined : cityFilter });

  const stats = useMemo(() => {
    if (!reports) return null;
    
    let rojo = 0, amarillo = 0, verde = 0;
    const byDim: Record<string, { rojo: number; amarillo: number; verde: number; n: number }> = {};
    
    INSTRUMENT.dimensions.forEach(d => {
      byDim[d.id] = { rojo: 0, amarillo: 0, verde: 0, n: 0 };
    });

    const frases: any[] = [];
    
    reports.forEach(r => {
      const answers = r.answers as Record<string, string>;
      let rCount = 0, aCount = 0, nCount = 0;

      Object.entries(answers).forEach(([key, val]) => {
        const dimId = key.split('_')[0];
        if (byDim[dimId]) {
          byDim[dimId].n++;
          if (val === 'rojo') byDim[dimId].rojo++;
          else if (val === 'amarillo') byDim[dimId].amarillo++;
          else if (val === 'verde') byDim[dimId].verde++;
        }
        nCount++;
        if (val === 'rojo') rCount++;
        else if (val === 'amarillo') aCount++;
      });

      let overallColor = 'verde';
      if (nCount > 0) {
        if (rCount / nCount >= 0.33) {
          rojo++;
          overallColor = 'rojo';
        } else if (aCount / nCount >= 0.33) {
          amarillo++;
          overallColor = 'amarillo';
        } else {
          verde++;
        }
      }

      if (r.openText) {
        frases.push({
          text: r.openText,
          city: r.city,
          color: overallColor,
          timestamp: r.createdAt
        });
      }
    });

    const total = reports.length;
    return {
      total,
      dist: { 
        rojo: total ? rojo / total : 0, 
        amarillo: total ? amarillo / total : 0, 
        verde: total ? verde / total : 0 
      },
      byDim,
      frases: frases.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  }, [reports]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070A13]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#070A13]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
        <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A13] text-[#EEF2FF] font-sans selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1100px] h-[700px] bg-[#7c5cff]/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-[-10%] w-[900px] h-[600px] bg-[#22c55e]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[900px] h-[600px] bg-[#f59e0b]/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#7c5cff] to-[#3b82f6] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">K</div>
            <div className="hidden sm:block">
              <div className="text-xl font-black leading-tight">Korai v1</div>
              <div className="text-xs text-[#A9B3DA]">Semáforo + colaboración gamificada</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-[#EEF2FF] hover:bg-white/10">Ciudadano</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white border-none shadow-lg shadow-primary/20">Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Stats & Dimensions */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="text-[#A9B3DA] text-xs font-bold uppercase tracking-wider mb-1">Participación</div>
                <div className="text-4xl font-black">{stats.total}</div>
                <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% vs mes anterior
                </div>
              </div>
              <div className="sm:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="text-[#A9B3DA] text-xs font-bold uppercase tracking-wider mb-2">Distribución Global</div>
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-white/10 border border-white/5">
                  <div style={{ width: `${stats.dist.verde * 100}%` }} className="bg-[#22c55e] transition-all duration-1000" />
                  <div style={{ width: `${stats.dist.amarillo * 100}%` }} className="bg-[#f59e0b] transition-all duration-1000" />
                  <div style={{ width: `${stats.dist.rojo * 100}%` }} className="bg-[#ef4444] transition-all duration-1000" />
                </div>
                <div className="grid grid-cols-3 mt-4 text-[10px] font-bold uppercase tracking-tighter sm:tracking-normal">
                  <div className="text-[#22c55e]">Verde {Math.round(stats.dist.verde * 100)}%</div>
                  <div className="text-[#f59e0b] text-center">Amarillo {Math.round(stats.dist.amarillo * 100)}%</div>
                  <div className="text-[#ef4444] text-right">Rojo {Math.round(stats.dist.rojo * 100)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black">Lectura Colectiva</h3>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-xs h-9">
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1430] border-white/10 text-white">
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    <SelectItem value="Berazategui">Berazategui</SelectItem>
                    <SelectItem value="Quilmes">Quilmes</SelectItem>
                    <SelectItem value="Florencio Varela">Florencio Varela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {INSTRUMENT.dimensions.map(d => {
                  const s = stats?.byDimension?.[d.id] || { rojo: 0, amarillo: 0, verde: 0, n: 0 };
                  const total = s.n || 1;
                  const color = (s.rojo / total >= 0.33) ? 'rojo' : (s.amarillo / total >= 0.33) ? 'amarillo' : 'verde';
                  
                  return (
                    <div key={d.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{d.emoji}</span>
                          <span className="font-bold text-sm">{d.name}</span>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          color === 'rojo' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          color === 'amarillo' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                          'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {color}
                        </div>
                      </div>
                      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5">
                        <div style={{ width: `${(s.verde / total) * 100}%` }} className="bg-[#22c55e]" />
                        <div style={{ width: `${(s.amarillo / total) * 100}%` }} className="bg-[#f59e0b]" />
                        <div style={{ width: `${(s.rojo / total) * 100}%` }} className="bg-[#ef4444]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Feedback & Topics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Últimos aportes
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.frases.length > 0 ? stats.frases.map((f, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 relative group">
                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${
                      f.color === 'rojo' ? 'bg-[#ef4444]' : f.color === 'amarillo' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
                    }`} />
                    <div className="text-xs text-[#A9B3DA] mb-1 flex justify-between">
                      <span>{f.city}</span>
                      <span>{new Date(f.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm italic leading-relaxed">"{f.text}"</p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-[#A9B3DA] text-sm">No hay comentarios aún.</div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#7c5cff]/20 to-transparent backdrop-blur-xl border border-[#7c5cff]/30 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black mb-2">Participación Cívica</h3>
              <p className="text-sm text-[#A9B3DA] mb-4">Tu diagnóstico individual se suma a la inteligencia territorial de Korai.</p>
              <Link href="/survey">
                <Button className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-12">
                  Sumar mi aporte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
