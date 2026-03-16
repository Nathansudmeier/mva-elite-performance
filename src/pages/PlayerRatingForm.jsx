import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import RatingCategoryBlock from "@/components/ratings/RatingCategoryBlock";
import { CATEGORIES, calcCategoryAverages } from "@/components/ratings/ratingUtils";

const EMPTY_FORM = {
  meting: "Meting 1",
  date: new Date().toISOString().split("T")[0],
  pass_kort: 0, pass_lang: 0, koppen: 0, scorend_vermogen: 0,
  duel_aanvallend: 0, duel_verdedigend: 0, balaanname: 0,
  speelveld_groot: 0, omschakeling_balverlies: 0, speelveld_klein: 0,
  omschakeling_balbezit: 0, kijkgedrag: 0,
  winnaarsmentaliteit: 0, leergierig: 0, opkomst_trainingen: 0,
  komt_afspraken_na: 0, doorzetter: 0,
  startsnelheid: 0, snelheid_lang: 0, postuur: 0,
  blessuregevoeligheid: 0, duelkracht: 0, motorische_vaardigheden: 0,
};

export default function PlayerRatingForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const ratingId = urlParams.get("ratingId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPlayerId, setSelectedPlayerId] = useState(urlParams.get("id") || "");
  const [form, setForm] = useState({ ...EMPTY_FORM, player_id: selectedPlayerId });

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: existingRatings = [] } = useQuery({
    queryKey: ["playerRatings", selectedPlayerId],
    queryFn: () => base44.entities.PlayerRating.filter({ player_id: selectedPlayerId }),
    enabled: !!selectedPlayerId,
  });

  const playerId = selectedPlayerId;
  const player = players.find((p) => p.id === selectedPlayerId);

  useEffect(() => {
    if (ratingId && existingRatings.length > 0) {
      const existing = existingRatings.find((r) => r.id === ratingId);
      if (existing) setForm({ ...existing });
    }
  }, [ratingId, existingRatings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, player_id: playerId };
      if (ratingId) return base44.entities.PlayerRating.update(ratingId, payload);
      return base44.entities.PlayerRating.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerRatings", playerId] });
      navigate(createPageUrl(`PlayerDetail?id=${playerId}`));
    },
  });

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const avgs = calcCategoryAverages(form);
  const allVals = Object.values(avgs).filter((v) => v > 0);
  const totalAvg = allVals.length > 0 ? Math.ceil(allVals.reduce((a, b) => a + b, 0) / allVals.length) : 0;

  return (
    <div className="pb-24 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(createPageUrl(`PlayerDetail?id=${playerId}`))} className="p-2 rounded-lg hover:bg-white/10">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Beoordeling</h1>
          {player && <p className="text-sm text-white/70">{player.name}</p>}
        </div>
      </div>

      {/* Meting & Datum */}
      <div className="elite-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#2F3650] font-semibold uppercase tracking-wider mb-1 block">Meetmoment</label>
            <Select value={form.meting} onValueChange={(v) => setField("meting", v)}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#fff" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Meting 1", "Meting 2", "Meting 3"].map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-[#2F3650] font-semibold uppercase tracking-wider mb-1 block">Datum</label>
            <Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: "#fff" }} />
          </div>
        </div>
        {totalAvg > 0 && (
          <div className="flex items-center justify-between rounded-lg px-4 py-2" style={{ backgroundColor: "#1A1F2E" }}>
            <span className="text-white/70 text-sm">Totaalgemiddelde</span>
            <span className="text-xl font-black" style={{ color: "#E8724A" }}>{totalAvg}/5</span>
          </div>
        )}
      </div>

      {/* Category blocks */}
      {Object.entries(CATEGORIES).map(([cat, criteria]) => (
        <div key={cat} className="rounded-xl p-4" style={{ backgroundColor: "#1A1F2E" }}>
          <RatingCategoryBlock
            title={cat}
            criteria={criteria}
            form={form}
            onChange={setField}
          />
        </div>
      ))}

      {/* Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 lg:sticky lg:bottom-auto" style={{ backgroundColor: "rgba(232,114,74,0.97)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full h-12 text-white font-bold text-base"
            style={{ background: "linear-gradient(135deg,#1A1F2E,#2F3650)" }}
          >
            <Save size={16} className="mr-2" />
            {saveMutation.isPending ? "Opslaan..." : "Beoordeling Opslaan"}
          </Button>
        </div>
      </div>
    </div>
  );
}