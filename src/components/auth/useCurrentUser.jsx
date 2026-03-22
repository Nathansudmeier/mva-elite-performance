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
  return {
    user,
    isLoading,
    isTrainer: user?.role === "trainer" || isAdmin,
    isSpeelster: user?.role === "speelster",
    isOuder: user?.role === "ouder",
    isTC: user?.role === "tc",
    playerId: user?.player_id,
  };
}