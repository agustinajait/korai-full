import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertReport, Report, DashboardStats } from "@shared/schema";

// Helper to validate and parse API responses
function parseResponse<T>(schema: any, data: unknown): T {
  // In a real app, use schema.parse(data). For now, we trust the backend types match frontend expectations via shared schema
  return data as T;
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertReport) => {
      const res = await fetch(api.reports.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      return await res.json() as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.stats.path] });
    },
  });
}

export function useReports(filters?: { city?: string; neighborhood?: string; days?: number }) {
  // Construct query key based on filters to ensure caching works correctly
  const queryKey = [api.reports.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build URL with query params
      const url = new URL(api.reports.list.path, window.location.origin);
      if (filters?.city) url.searchParams.set("city", filters.city);
      if (filters?.neighborhood) url.searchParams.set("neighborhood", filters.neighborhood);
      if (filters?.days) url.searchParams.set("days", String(filters.days));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch reports");
      return await res.json() as Report[];
    },
  });
}

export function useStats(city?: string) {
  const queryKey = [api.reports.stats.path, city];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.reports.stats.path, window.location.origin);
      if (city && city !== "all") url.searchParams.set("city", city);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json() as DashboardStats;
    },
  });
}
