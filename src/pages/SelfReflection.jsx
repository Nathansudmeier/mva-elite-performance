import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, BookOpen } from "lucide-react";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

export default function SelfReflection() {
  const queryClient = useQueryClient();
  const { isTrainer, playerId } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    match_opponent: "", goal_1_rating: "", goal_1_notes: "",
    goal_2_rating: "", goal_2_notes: "", goal_3_rating: "", goal_3_notes: "", general_notes: "",
  });

  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: () => base44.entities.Player.list() });
  const { data: reflections = [] } = useQuery({ queryKey: ["reflections"], queryFn: () => base44.entities.SelfReflection.list("-date") });

  const activePlayers = players.filter((p) => p.active !== false);
  const selectedPlayerData = activePlayers.find((p) => p.id === selectedPlayer);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.SelfReflection.create({
      ...form, player_id: selectedPlayer,
      goal_1_rating: form.goal_1_rating ? Number(form.goal_1_rating) : undefined,
      goal_2_rating: form.goal_2_rating ? Number(form.goal_2_rating) : undefined,
      goal_3_rating: form.goal_3_rating ? Number(form.goal_3_rating) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      setDialogOpen(false);
      setForm({ date: new Date().toISOString().split("T")[0], match_opponent: "", goal_1_rating: "", goal_1_notes: "", goal_2_rating: "", goal_2_notes: "", goal_3_rating: "", goal_3_notes: "", general_notes: "" });
    },
  });

  const displayReflections = isTrainer
    ? (filterPlayer === "all" ? reflections : reflections.filter((r) => r.player_id === filterPlayer))
    : reflections.filter((r) => r.player_id === playerId);

  const inputStyle = {
    width: "100%", background: "#ffffff", border: "2px solid #1a1a1a",
    borderRadius: "12px", padding: "10px 14px", fontSize: "14px", color: "#1a1a1a",
    fontFamily: "inherit", outline: "none",
  };

  const goalColors = ["#08D068", "#FF6800", "#9B5CFF"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="t-page-title">Zelfreflectie</h1>
          <p className="t-secondary">Wekelijkse wedstrijdbeoordeling</p>
        </div>
        <button
          onClick={() => { setSelectedPlayer(isTrainer ? "" : playerId); setDialogOpen(true); }}
          className="btn-secondary"
          style={{ width: "auto" }}
        >
          <Plus size={14} /> Nieuwe Reflectie
        </button>
      </div>

      {/* Filter */}
      {isTrainer && (
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", color: "#1a1a1a", fontWeight: 600, width: "200px" }}>
            <SelectValue placeholder="Filter op speelster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle speelsters</SelectItem>
            {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* Cards grid */}
      {displayReflections.length === 0 ? (
        <div style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "48px 24px", textAlign: "center" }}>
          <BookOpen size={36} style={{ color: "rgba(26,26,26,0.15)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.40)", fontWeight: 600 }}>Nog geen reflecties ingevoerd</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {displayReflections.map((r) => {
            const player = players.find((p) => p.id === r.player_id);
            return (
              <div key={r.id} style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a", padding: "1rem" }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>{player?.name || "Onbekend"}</p>
                    <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.50)", marginTop: "2px" }}>vs. {r.match_opponent || "–"}</p>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(26,26,26,0.06)", border: "1.5px solid rgba(26,26,26,0.12)", borderRadius: "20px", padding: "3px 10px", color: "rgba(26,26,26,0.55)", flexShrink: 0 }}>
                    {format(new Date(r.date), "d MMM", { locale: nl })}
                  </span>
                </div>

                {/* Goal ratings */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[[player?.iop_goal_1, r.goal_1_rating, r.goal_1_notes, goalColors[0]],
                    [player?.iop_goal_2, r.goal_2_rating, r.goal_2_notes, goalColors[1]],
                    [player?.iop_goal_3, r.goal_3_rating, r.goal_3_notes, goalColors[2]]].map(([label, rating, notes, color], i) => rating ? (
                    <div key={i} style={{ background: "rgba(26,26,26,0.04)", border: "1.5px solid rgba(26,26,26,0.08)", borderRadius: "10px", padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>{label || `Doel ${i + 1}`}</span>
                        <span style={{ fontSize: "18px", fontWeight: 900, color, letterSpacing: "-0.5px", marginLeft: "8px" }}>{rating}<span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,26,0.35)" }}>/10</span></span>
                      </div>
                      {notes && <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "4px", lineHeight: 1.4 }}>{notes}</p>}
                    </div>
                  ) : null)}
                </div>

                {/* General notes */}
                {r.general_notes && (
                  <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", marginTop: "10px", paddingTop: "10px", borderTop: "1.5px solid rgba(26,26,26,0.08)", lineHeight: 1.5 }}>{r.general_notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(26,26,26,0.45)" }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            style={{ background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "22px", boxShadow: "4px 4px 0 #1a1a1a", padding: "1.5rem", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color: "#FF6800", marginBottom: "2px" }}>Nieuw</p>
                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Zelfreflectie</h2>
              </div>
              <button onClick={() => setDialogOpen(false)} style={{ background: "none", border: "2px solid #1a1a1a", borderRadius: "10px", width: "32px", height: "32px", cursor: "pointer", fontSize: "18px", color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Speelster selecteren */}
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "12px", color: "#1a1a1a", fontWeight: 600 }}>
                  <SelectValue placeholder="Selecteer speelster" />
                </SelectTrigger>
                <SelectContent>
                  {activePlayers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Datum + tegenstander */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                <input placeholder="Tegenstander" value={form.match_opponent} onChange={(e) => setForm({ ...form, match_opponent: e.target.value })} style={inputStyle} />
              </div>

              {/* Doelen */}
              {selectedPlayerData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[[selectedPlayerData.iop_goal_1, "goal_1_rating", "goal_1_notes", goalColors[0]],
                    [selectedPlayerData.iop_goal_2, "goal_2_rating", "goal_2_notes", goalColors[1]],
                    [selectedPlayerData.iop_goal_3, "goal_3_rating", "goal_3_notes", goalColors[2]]].map(([goal, ratingKey, notesKey, color]) => goal ? (
                    <div key={ratingKey} style={{ border: "2px solid #1a1a1a", borderRadius: "14px", padding: "12px", background: "rgba(26,26,26,0.02)" }}>
                      <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.10em", color, marginBottom: "8px" }}>{goal}</p>
                      <input
                        type="number" min="1" max="10" placeholder="Score (1-10)"
                        value={form[ratingKey]}
                        onChange={(e) => setForm({ ...form, [ratingKey]: e.target.value })}
                        style={{ ...inputStyle, marginBottom: "8px" }}
                      />
                      <textarea
                        placeholder="Toelichting..."
                        value={form[notesKey]}
                        onChange={(e) => setForm({ ...form, [notesKey]: e.target.value })}
                        rows={2}
                        style={{ ...inputStyle, resize: "none" }}
                      />
                    </div>
                  ) : null)}
                </div>
              )}

              {/* Algemene notities */}
              <textarea
                placeholder="Algemene notities..."
                value={form.general_notes}
                onChange={(e) => setForm({ ...form, general_notes: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />

              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !selectedPlayer}
                className="btn-primary"
              >
                {saveMutation.isPending ? "Opslaan..." : "Reflectie opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}