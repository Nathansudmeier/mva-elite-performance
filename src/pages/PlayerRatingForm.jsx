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
import { useCurrentUser } from "@/components/auth/useCurrentUser";

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
  const { user, isTrainer, playerId: myPlayerId } = useCurrentUser();
  const isReadOnly = !isTrainer && user?.role !== "admin";

  const [selectedPlayerId, setSelectedPlayerId] = useState(urlParams.get("player_id") || urlParams.get("id") || (isReadOnly ? myPlayerId : "") || "");
  const [form, setForm] = useState({ ...EMPTY_FORM, player_id: selectedPlayerId });

  const { data: players = [], isLoading: playersLoading } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
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

  const handlePlayerChange = (id) => {
    setSelectedPlayerId(id);
    setForm({ ...EMPTY_FORM, player_id: id });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, player_id: selectedPlayerId };
      if (ratingId) return base44.entities.PlayerRating.update(ratingId, payload);
      return base44.entities.PlayerRating.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerRatings", selectedPlayerId] });
      navigate(createPageUrl(`PlayerDetail?id=${selectedPlayerId}`));
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
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="t-page-title">Beoordeling</h1>
          {player && <p className="t-secondary">{player.name}</p>}
          {isReadOnly && <p className="t-tertiary mt-0.5">Alleen inzien</p>}
        </div>
      </div>

      {/* Speler selectie — alleen voor trainers */}
      {!isReadOnly && (
        <div className="glass p-5">
          <label className="t-label mb-2 block">Speler</label>
          {playersLoading ? (
            <div className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
          ) : (
            <Select value={selectedPlayerId} onValueChange={handlePlayerChange}>
              <SelectTrigger style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }}>
                <SelectValue placeholder="Selecteer een speler..." />
              </SelectTrigger>
              <SelectContent>
                {players.filter(p => p.active !== false).sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.shirt_number ? `#${p.shirt_number} ` : ""}{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Meting & Datum */}
      <div className="glass p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="t-label mb-1 block">Meetmoment</label>
            {isReadOnly ? (
              <div className="flex gap-2 flex-wrap">
                {["Meting 1", "Meting 2", "Meting 3"].map((m) => (
                  <button key={m} onClick={() => setField("meting", m)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={form.meting === m ? { background: "#FF6B00", color: "#fff" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "0.5px solid rgba(255,255,255,0.15)" }}
                  >{m}</button>
                ))}
              </div>
            ) : (
              <Select value={form.meting} onValueChange={(v) => setField("meting", v)}>
                <SelectTrigger style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Meting 1", "Meting 2", "Meting 3"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="t-label mb-1 block">Datum</label>
            <Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} readOnly={isReadOnly} />
          </div>
        </div>
        {totalAvg > 0 && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,107,0,0.15)", border: "0.5px solid rgba(255,107,0,0.3)" }}>
            <span className="t-secondary">Totaalgemiddelde</span>
            <span className="t-metric-orange" style={{ fontSize: "20px" }}>{totalAvg}/5</span>
          </div>
        )}
      </div>

      {/* Category blocks */}
      {!selectedPlayerId && <p className="t-tertiary text-center py-4">Selecteer eerst een speler om de beoordeling in te vullen.</p>}
      {selectedPlayerId && Object.entries(CATEGORIES).map(([cat, criteria]) => (
        <div key={cat} className="glass p-4">
          <RatingCategoryBlock
            title={cat}
            criteria={criteria}
            form={form}
            onChange={isReadOnly ? () => {} : setField}
            readOnly={isReadOnly}
          />
        </div>
      ))}

      {/* Save — alleen voor trainers */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 p-4 lg:sticky lg:bottom-auto" style={{ background: "rgba(20,10,2,0.90)", borderTop: "0.5px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
          <div className="max-w-lg mx-auto">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">
              <Save size={16} />
              {saveMutation.isPending ? "Opslaan..." : "Beoordeling Opslaan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}