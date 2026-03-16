import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 60000,
  });

  return {
    user,
    isLoading,
    isTrainer: user?.role === "trainer",
    isSpeelster: user?.role === "speelster",
    playerId: user?.player_id,
  };
}