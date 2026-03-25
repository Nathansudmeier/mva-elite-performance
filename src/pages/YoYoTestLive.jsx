import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Check } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const YOYO_LEVELS = [
  "5.1", "9.1", "11.1", "11.2", "12.1", "12.2", "12.3",
  "13.1", "13.2", "13.3", "13.4", "14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8",
  "15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7", "15.8",
  "16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8",
  "17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7", "17.8",
  "18.1", "18.2", "18.3", "18.4", "18.5", "18.6", "18.7", "18.8",
  "19.1", "19.2", "19.3", "19.4", "19.5", "19.6", "19.7", "19.8",
  "20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8",
  "21.1", "21.2", "21.3", "21.4", "21.5", "21.6", "21.7", "21.8",
  "22.1", "22.2", "22.3", "22.4", "22.5", "22.6", "22.7", "22.8",
  "23.1", "23.2", "23.3", "23.4", "23.5", "23.6", "23.7", "23.8",
];

export default function YoYoTestLive() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const agendaId = searchParams.get("agenda");
  
  const [testResults, setTestResults] = useState({});
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);

  // Fetch agenda item + attendance
  const { data: agenda } = useQuery({
    queryKey: ["agenda", agendaId],
    queryFn: () => agendaId ? base44.entities.AgendaItem.get(agendaId) : null,
    enabled: !!agendaId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", agendaId],
    queryFn: () => agendaId ? base44.entities.AgendaAttendance.filter({ agenda_item_id: agendaId }) : [],
    enabled: !!agendaId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.filter({ active: true }),
  });

  const { data: existingTests = [] } = useQuery({
    queryKey: ["yoyo-existing"],
    queryFn: () => base44.entities.YoYoTest.list(),
  });

  // Get present players for this training
  const presentPlayers = attendance
    .filter(a => a.attendance_status !== "afwezig")
    .map(a => {
      const player = players.find(p => p.id === a.player_id);
      const lastTest = existingTests
        .filter(t => t.player_id === a.player_id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      return {
        id: a.player_id,
        name: player?.name || "Unknown",
        lastLevel: lastTest?.level || "–",
        photoUrl: player?.photo_url,
      };
    });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (results) => {
      const toSave = Object.entries(results)
        .filter(([_, level]) => level)
        .map(([playerId, level]) => ({
          player_id: playerId,
          date: testDate,
          level,
        }));
      
      for (const record of toSave) {
        await base44.entities.YoYoTest.create(record);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yoyo-existing"] });
      setTestResults({});
      alert("Yo-Yo test resultaten opgeslagen!");
    },
  });

  const handleLevelSelect = (playerId, level) => {
    setTestResults(prev => ({
      ...prev,
      [playerId]: prev[playerId] === level ? null : level,
    }));
  };

  const savedCount = Object.values(testResults).filter(Boolean).length;

  return (
    <div style={{ background: "#FFF3E8", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "#ffffff", borderBottom: "2.5px solid #1a1a1a",
        padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: "40px", height: "40px", borderRadius: "12px", border: "2px solid #1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(26,26,26,0.04)",
        }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 className="t-section-title">Yo-Yo Test</h1>
          <p className="t-tertiary">{format(new Date(testDate), "d MMMM yyyy", { locale: nl })}</p>
        </div>
        <div style={{ width: "40px" }} />
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        
        {/* Date picker */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Testdatum
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            style={{
              width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #1a1a1a",
              fontSize: "14px", fontWeight: 600, boxSizing: "border-box",
            }}
          />
        </div>

        {/* Players grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {presentPlayers.map(player => (
            <div key={player.id} style={{
              background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "16px",
              boxShadow: "2px 2px 0 #1a1a1a", padding: "14px",
            }}>
              {/* Player header */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                {player.photoUrl && (
                  <img src={player.photoUrl} alt={player.name}
                    style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover", border: "2px solid #1a1a1a" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>{player.name}</p>
                  <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.55)", marginTop: "2px" }}>
                    Vorig niveau: <span style={{ fontWeight: 800, color: "#FF6800" }}>{player.lastLevel}</span>
                  </p>
                </div>
                {testResults[player.id] && (
                  <div style={{
                    background: "#08D068", color: "#ffffff", width: "32px", height: "32px",
                    borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #1a1a1a", fontWeight: 800,
                  }}>
                    <Check size={16} />
                  </div>
                )}
              </div>

              {/* Level selector grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                {YOYO_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(player.id, level)}
                    style={{
                      padding: "8px 6px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                      border: "2px solid #1a1a1a",
                      background: testResults[player.id] === level ? "#FF6800" : "#ffffff",
                      color: testResults[player.id] === level ? "#ffffff" : "#1a1a1a",
                      cursor: "pointer", transition: "all 0.15s",
                      boxShadow: testResults[player.id] === level ? "2px 2px 0 #1a1a1a" : "none",
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button - sticky footer */}
      {savedCount > 0 && (
        <div style={{
          position: "fixed", bottom: "0", left: "0", right: "0",
          background: "#ffffff", borderTop: "2.5px solid #1a1a1a", padding: "12px 16px",
          boxShadow: "0 -3px 10px rgba(0,0,0,0.05)",
        }}>
          <button
            onClick={() => saveMutation.mutate(testResults)}
            disabled={saveMutation.isPending}
            style={{
              width: "100%", padding: "14px", borderRadius: "14px", border: "2.5px solid #1a1a1a",
              background: "#FF6800", color: "#ffffff", fontSize: "15px", fontWeight: 800,
              cursor: "pointer", boxShadow: "3px 3px 0 #1a1a1a",
              opacity: saveMutation.isPending ? 0.6 : 1, transition: "all 0.1s",
            }}
          >
            {saveMutation.isPending ? "Opslaan..." : `Opslaan (${savedCount})`}
          </button>
        </div>
      )}
    </div>
  );
}