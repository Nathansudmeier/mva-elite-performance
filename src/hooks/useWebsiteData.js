import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Gedeelde hook voor de publieke website-data.
 * Haalt data direct op via de entities SDK (geen backend functie nodig).
 */
export function useWebsiteData() {
  return useQuery({
    queryKey: ["websiteData"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [
        instellingenList,
        prestaties,
        players,
        agendaItems,
        trainers,
        matches,
        nieuwsberichten,
        uitgelichteWedstrijden,
        sponsors,
      ] = await Promise.all([
        base44.entities.WebsiteInstellingen.list(),
        base44.entities.Prestatie.list(),
        base44.entities.Player.filter({ active: true }),
        base44.entities.AgendaItem.filter({ type: "Wedstrijd" }),
        base44.entities.Trainer.filter({ active: true }),
        base44.entities.Match.list("-date"),
        base44.entities.Nieuwsbericht.filter({ gepubliceerd: true }),
        base44.entities.UitgelichtWedstrijd.list(),
        base44.entities.Sponsor.list(),
      ]);

      const activeUitgelicht = (uitgelichteWedstrijden || [])
        .filter(w => w.actief !== false && w.datum && w.datum >= today)
        .sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));

      const liveMatches = (matches || []).filter(m => m.live_status === "live" || m.live_status === "halftime");

      const activeSponsors = (sponsors || [])
        .filter(s => s.actief !== false)
        .sort((a, b) => a.tier - b.tier || a.volgorde - b.volgorde);

      return {
        instellingen: instellingenList?.[0] || null,
        prestaties: (prestaties || []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)),
        players: players || [],
        wedstrijden: agendaItems || [],
        trainers: trainers || [],
        matches: matches || [],
        liveMatches,
        sponsors: activeSponsors,
        nieuwsberichten: (nieuwsberichten || []).sort((a, b) => new Date(b.datum) - new Date(a.datum)),
        uitgelichteWedstrijden: activeUitgelicht,
      };
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}