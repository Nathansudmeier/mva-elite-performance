import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 60000,
  });

  const isAdmin = user?.role === "admin";
  const isSpeelster = user?.role === "speelster";
  const isOuder = user?.data?.role === "ouder" || user?.role === "ouder";
  const playerIdFromData = user?.data?.player_id;
  
  return {
    user,
    isLoading,
    isTrainer: user?.role === "trainer" || isAdmin,
    isSpeelster,
    isOuder,
    isTC: user?.role === "tc",
    playerId: user?.player_id || playerIdFromData,
  };
}