import { useState } from "react";
import { useStats } from "@/hooks/use-reports";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/charts/stat-card";
import { CITIES, INSTRUMENT } from "@/lib/instrument";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Loader2, AlertCircle, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#22c55e"
};

export default function Dashboard() {
  const [cityFilter, setCityFilter] = useState<string>("all");
  const { data: stats, isLoading, error } = useStats(cityFilter);

  const pieData = stats ? [
    { name: 'Rojo', value: stats.distribution.rojo },
    { name: 'Amarillo', value: stats.distribution.amarillo },
    { name: 'Verde', value: stats.distribution.verde },
  ] : [];

  const barData = stats ? Object.entries(stats.byDimension).map(([dimId, counts]) => {
    const dim = INSTRUMENT.dimensions.find(d => d.id === dimId);
    return {
      name: dim?.name || dimId,
      rojo: counts.rojo,
      amarillo: counts.amarillo,
      verde: counts.verde
    };
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
        <p className="text-muted-foreground mb-4">No se pudieron obtener las estadísticas.</p>
        <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const totalResponses = stats.total;
  const positivityRate = totalResponses > 0 
    ? Math.round((stats.distribution.verde / totalResponses) * 100)
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Dashboard Social</h1>
          <p className="text-muted-foreground">Monitoreo en tiempo real de indicadores de calidad de vida.</p>
        </div>
        
        <div className="w-full md:w-auto min-w-[200px]">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 backdrop-blur-md">
              <SelectValue placeholder="Filtrar por ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {CITIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Participación Total" 
          value={totalResponses} 
          icon={<Users className="w-5 h-5" />}
          trend="up"
          trendValue="+12% vs mes anterior"
        />
        <StatCard 
          title="Índice de Bienestar" 
          value={`${positivityRate}%`} 
          icon={<TrendingUp className="w-5 h-5" />}
          trend={positivityRate > 50 ? "up" : "down"}
          trendValue="Media Global"
        />
        <GlassCard className="p-5 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Estado General</h3>
          <div className="flex w-full h-4 rounded-full overflow-hidden">
            <div style={{ width: `${(stats.distribution.verde / stats.total) * 100}%` }} className="bg-green-500 h-full" />
            <div style={{ width: `${(stats.distribution.amarillo / stats.total) * 100}%` }} className="bg-yellow-500 h-full" />
            <div style={{ width: `${(stats.distribution.rojo / stats.total) * 100}%` }} className="bg-red-500 h-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium opacity-80">
            <span className="text-green-400">Verde {Math.round((stats.distribution.verde / stats.total) * 100)}%</span>
            <span className="text-yellow-400">Amarillo {Math.round((stats.distribution.amarillo / stats.total) * 100)}%</span>
            <span className="text-red-400">Rojo {Math.round((stats.distribution.rojo / stats.total) * 100)}%</span>
          </div>
        </GlassCard>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 h-[400px]">
          <h3 className="text-xl font-bold mb-6">Distribución por Dimensión</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#e2e8f0', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="verde" stackId="a" fill={COLORS.verde} radius={[0, 0, 0, 0]} />
              <Bar dataKey="amarillo" stackId="a" fill={COLORS.amarillo} radius={[0, 0, 0, 0]} />
              <Bar dataKey="rojo" stackId="a" fill={COLORS.rojo} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6 h-[400px]">
          <h3 className="text-xl font-bold mb-6">Impacto Global</h3>
          <div className="relative h-full w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-display">{totalResponses}</span>
              <span className="text-sm text-muted-foreground">Reportes</span>
            </div>
          </div>
        </GlassCard>
      </div>
      
      {/* Floating Start Button for Kiosk Mode */}
      <div className="fixed bottom-6 right-6">
        <Link href="/">
           <Button className="rounded-full w-14 h-14 bg-white text-black hover:bg-white/90 shadow-xl p-0">
             <AlertCircle className="w-6 h-6" />
           </Button>
        </Link>
      </div>
    </div>
  );
}
