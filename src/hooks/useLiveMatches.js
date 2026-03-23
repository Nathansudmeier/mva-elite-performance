import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useLiveMatches() {
  return useQuery({
    queryKey: ["live-matches"],
    queryFn: async () => {
      // Fetch all matches
      const matches = await base44.entities.Match.list();
      
      // Filter for live matches (live_status is "live" or "halftime")
      return matches.filter(m => m.live_status === "live" || m.live_status === "halftime");
    },
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });
}