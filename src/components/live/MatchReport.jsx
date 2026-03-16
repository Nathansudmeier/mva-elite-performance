import React from "react";
import { Trophy, ArrowLeftRight, FileText, Target } from "lucide-react";

export default function MatchReport({ match, players }) {
  const events = match.live_events || [];
  const getPlayer = (id) => players.find(p => p.id === id);

  const goals = events.filter(e => e.type === "goal_mva" || e.type === "goal_against");
  const subs = events.filter(e => e.type === "substitution");
  const notes = events.filter(e => e.type === "note");

  const scoreHome = events.filter(e => e.type === "goal_mva").length;
  const scoreAway = events.filter(e => e.type === "goal_against").length;

  return (
    <div className="space-y-4">
      {/* Final score */}
      <div className="elite-card p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#2F3650" }}>Eindstand</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xs text-[#2F3650]">MVA Noord</p>
            <span className="text-5xl font-black" style={{ color: "#D45A30" }}>{scoreHome}</span>
          </div>
          <span className="text-3xl font-black text-[#1A1F2E]">—</span>
          <div className="text-center">
            <p className="text-xs text-[#2F3650]">{match.opponent}</p>
            <span className="text-5xl font-black text-[#1A1F2E]">{scoreAway}</span>
          </div>
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div className="elite-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} style={{ color: "#D45A30" }} />
            <h3 className="font-bold text-[#1A1F2E]">Doelpunten</h3>
          </div>
          <div className="space-y-2">
            {goals.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: e.type === "goal_mva" ? "#FDE8DC" : "#fee2e2" }}>
                <span className="text-xs font-bold w-8" style={{ color: e.type === "goal_mva" ? "#D45A30" : "#C0392B" }}>{e.minute}'</span>
                <span className="text-sm font-medium text-[#1A1F2E]">
                  {e.type === "goal_mva" ? (
                    <>⚽ {getPlayer(e.player_id)?.name || "Onbekend"}
                      {e.assist_player_id && <span className="text-xs text-[#2F3650]"> (assist: {getPlayer(e.assist_player_id)?.name})</span>}
                    </>
                  ) : "🔴 Goal Tegen"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Substitutions */}
      {subs.length > 0 && (
        <div className="elite-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight size={16} style={{ color: "#1A1F2E" }} />
            <h3 className="font-bold text-[#1A1F2E]">Wissels</h3>
          </div>
          <div className="space-y-2">
            {subs.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FDE8DC" }}>
                <span className="text-xs font-bold w-8" style={{ color: "#D45A30" }}>{e.minute}'</span>
                <span className="text-sm text-[#1A1F2E]">
                  🔴 {getPlayer(e.player_out_id)?.name} → 🟢 {getPlayer(e.player_in_id)?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Halftime notes */}
      {match.halftime_notes && (
        <div className="elite-card p-5">
          <h3 className="font-bold text-[#1A1F2E] mb-2">Rustbespreking</h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "#2F3650" }}>{match.halftime_notes}</p>
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="elite-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} style={{ color: "#2F3650" }} />
            <h3 className="font-bold text-[#1A1F2E]">Notities</h3>
          </div>
          <div className="space-y-2">
            {notes.map((e, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FDE8DC" }}>
                <span className="text-xs font-bold w-8 mt-0.5" style={{ color: "#D45A30" }}>{e.minute}'</span>
                <span className="text-sm text-[#1A1F2E]">{e.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}