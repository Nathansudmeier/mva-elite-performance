import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Gedeelde hook voor de publieke website-data.
 * Cachet de response 1 minuut, zodat alle pagina's en de Layout
 * dezelfde data delen zonder de backend opnieuw te raken.
 */
export function useWebsiteData() {
  return useQuery({
    queryKey: ["websiteData"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getWebsiteData", {});
      return res?.data || {};
    },
    staleTime: 60 * 1000, // 1 minuut fresh
    gcTime: 10 * 60 * 1000, // 10 minuten in geheugen
    refetchOnWindowFocus: false,
  });
}