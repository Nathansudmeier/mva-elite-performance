import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ChevronDown } from "lucide-react";

const FORMATIONS = ["4-3-3", "4-2-3-1", "3-5-2", "4-4-2"];

function lineupArrayToMap(arr) {
  if (!arr) return {};
  return arr.reduce((acc, { slot, player_id }) => {
    if (slot && player_id) acc[slot] = player_id;
    return acc;
  }, {});
}

function lineupMapToArray(map) {
  return Object.entries(map).map(([slot, player_id]) => ({ slot, player_id }));
}

const FIELD_POSITIONS = {
  "4-3-3": ["GK", "LB", "CB1", "CB2", "RB", "CM1", "CM2", "CM3", "LW", "ST", "RW"],
  "4-2-3-1": ["GK", "LB", "CB1", "CB2", "RB", "DM1", "DM2", "CAM1", "CAM2", "CAM3", "ST"],
  "3-5-2": ["GK", "CB1", "CB2", "CB3", "LWB", "CM1", "CM2", "CM3", "RWB", "ST1", "ST2"],
  "4-4-2": ["GK", "LB", "CB1", "CB2", "RB", "LM", "CM1", "CM2", "RM", "ST1", "ST2"],
};

export default function MatchEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("matchId");

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => base44.entities.Match.get(matchId),
    enabled: !!matchId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const activePlayers = players.filter(p => p.active !== false);

  // Form state
  const [activeTab, setActiveTab] = useState("info");
  const [formData, setFormData] = useState({
    opponent: "",
    opponent_logo: "",
    date: "",
    home_away: "Thuis",
    score_home: "",
    score_away: "",
    formation: "4-3-3",
    lineup: {},
    substitutes: [],
    ball_possession: "",
    pressing: "",
    transition: "",
    set_pieces: "",
    notes: "",
  });

  const [lineupMap, setLineupMap] = useState({});
  const [expandedTactic, setExpandedTactic] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Compress image to max 200x200px
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > 200 || h > 200) {
            const scale = Math.min(200 / w, 200 / h);
            w = w * scale;
            h = h * scale;
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const response = await base44.integrations.Core.UploadFile({ file: compressed });
      setFormData({ ...formData, opponent_logo: response.file_url });
    } finally {
      setUploading(false);
    }
  };

  // Load match data
  useEffect(() => {
    if (match) {
      setFormData({
        opponent: match.opponent || "",
        opponent_logo: match.opponent_logo || "",
        date: match.date || "",
        home_away: match.home_away || "Thuis",
        score_home: match.score_home ?? "",
        score_away: match.score_away ?? "",
        formation: match.formation || "4-3-3",
        lineup: match.lineup || [],
        substitutes: match.substitutes || [],
        ball_possession: match.ball_possession || "",
        pressing: match.pressing || "",
        transition: match.transition || "",
        set_pieces: match.set_pieces || "",
        notes: match.notes || "",
      });
      setLineupMap(lineupArrayToMap(match.lineup));
    }
  }, [match]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Match.update(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      navigate(-1);
    },
  });

  const handleSave = () => {
    const saveData = {
      ...formData,
      lineup: lineupMapToArray(lineupMap),
      score_home: formData.score_home ? parseInt(formData.score_home) : undefined,
      score_away: formData.score_away ? parseInt(formData.score_away) : undefined,
    };
    saveMutation.mutate(saveData);
  };

  const handleSelectPlayer = (playerId) => {
    if (selectedPosition) {
      setLineupMap({ ...lineupMap, [selectedPosition]: playerId });
      setSelectedPosition(null);
      setShowPlayerPicker(false);
    }
  };

  const getLineupPlayers = Object.values(lineupMap).filter(Boolean);
  const availableSubstitutes = activePlayers.filter(
    p => !getLineupPlayers.includes(p.id) && !formData.substitutes.includes(p.id)
  );
  const currentSubstitutes = activePlayers.filter(p =>
    formData.substitutes.includes(p.id)
  );

  const toggleSubstitute = (playerId) => {
    setFormData({
      ...formData,
      substitutes: formData.substitutes.includes(playerId)
        ? formData.substitutes.filter(id => id !== playerId)
        : [...formData.substitutes, playerId],
    });
  };

  const GLASS_STYLE = {
    background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "12px 16px",
    color: "white",
    fontSize: "15px",
  };

  const LABEL_STYLE = {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    marginBottom: "8px",
    letterSpacing: "0.07em",
  };

  const INPUT_STYLE = {
    ...GLASS_STYLE,
    width: "100%",
    border: "0.5px solid rgba(255,255,255,0.12)",
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "#1c0e04",
      overflow: "hidden",
      zIndex: 50,
    }}>
      {/* Background image with overlays */}
      <img
        src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/e47690dd6_wedstrijd.jpg"
        alt="Wedstrijd veld"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
        }}
      />
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.70)",
        zIndex: 1,
      }} />
      <div style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(180deg, rgba(28,14,4,0.60) 0%, rgba(28,14,4,0.85) 100%)",
        zIndex: 1,
      }} />

      {/* Header */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "rgba(28,14,4,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        paddingLeft: "16px",
        paddingRight: "16px",
        zIndex: 3,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={18} /> Wedstrijd
        </button>
        <div style={{ marginLeft: "auto", fontSize: "16px", fontWeight: 600, color: "white" }}>
          Bewerken
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position: "fixed",
        top: "60px",
        left: 0,
        right: 0,
        height: "50px",
        background: "rgba(28,14,4,0.80)",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        overflowX: "auto",
        overflowY: "hidden",
        display: "flex",
        gap: "8px",
        paddingLeft: "16px",
        paddingRight: "16px",
        zIndex: 3,
      }}>
        {["Info", "Opstelling", "Tactiek", "Notities"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{
              whiteSpace: "nowrap",
              background: activeTab === tab.toLowerCase() ? "#FF6B00" : "rgba(255,255,255,0.08)",
              color: activeTab === tab.toLowerCase() ? "white" : "rgba(255,255,255,0.60)",
              border: activeTab === tab.toLowerCase() ? "none" : "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "8px",
              marginBottom: "8px",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        position: "fixed",
        top: "110px",
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 2,
      }}>
        <div style={{ padding: "16px", paddingBottom: "32px", maxWidth: "600px", margin: "0 auto" }}>
          {/* INFO TAB */}
          {activeTab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={LABEL_STYLE}>Tegenstander</div>
                <input
                  type="text"
                  value={formData.opponent}
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  placeholder="Tegenstander"
                  style={{
                    ...INPUT_STYLE,
                    color: "white",
                    "::placeholder": { color: "rgba(255,255,255,0.30)" },
                  }}
                />
              </div>

              <div>
                <div style={LABEL_STYLE}>Datum</div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    ...INPUT_STYLE,
                    color: "white",
                  }}
                />
              </div>

              <div>
                <div style={LABEL_STYLE}>Thuis/Uit</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["Thuis", "Uit"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({ ...formData, home_away: option })}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: formData.home_away === option ? "#FF6B00" : "rgba(255,255,255,0.08)",
                        color: formData.home_away === option ? "white" : "rgba(255,255,255,0.60)",
                        border: formData.home_away === option ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={LABEL_STYLE}>Score</div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="number"
                    value={formData.score_home}
                    onChange={(e) => setFormData({ ...formData, score_home: e.target.value })}
                    placeholder="0"
                    style={{ ...INPUT_STYLE, flex: 1 }}
                  />
                  <div style={{ color: "rgba(255,255,255,0.40)", fontSize: "14px", fontWeight: 600 }}>–</div>
                  <input
                    type="number"
                    value={formData.score_away}
                    onChange={(e) => setFormData({ ...formData, score_away: e.target.value })}
                    placeholder="0"
                    style={{ ...INPUT_STYLE, flex: 1 }}
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                style={{
                  background: "#FF6B00",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  height: "52px",
                  fontSize: "16px",
                  fontWeight: 600,
                  width: "100%",
                  cursor: "pointer",
                  marginTop: "12px",
                }}
              >
                Opslaan
              </button>
            </div>
          )}

          {/* OPSTELLING TAB */}
          {activeTab === "opstelling" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={LABEL_STYLE}>Formatie</div>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                  {FORMATIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFormData({ ...formData, formation: f });
                        setLineupMap({});
                      }}
                      style={{
                        whiteSpace: "nowrap",
                        padding: "8px 14px",
                        background: formData.formation === f ? "#FF6B00" : "rgba(255,255,255,0.08)",
                        color: formData.formation === f ? "white" : "rgba(255,255,255,0.60)",
                        border: formData.formation === f ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field visualization */}
              <div style={{
                background: "rgba(20, 80, 40, 0.3)",
                border: "1px solid rgba(76,175,80,0.3)",
                borderRadius: "12px",
                padding: "16px",
                minHeight: "240px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                alignContent: "center",
              }}>
                {FIELD_POSITIONS[formData.formation]?.map((pos) => {
                  const playerId = lineupMap[pos];
                  const playerName = activePlayers.find(p => p.id === playerId)?.name;
                  return (
                    <button
                      key={pos}
                      onClick={() => {
                        setSelectedPosition(pos);
                        setShowPlayerPicker(true);
                      }}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: playerName ? "#FF6B00" : "rgba(255,255,255,0.10)",
                        border: playerName ? "2px solid #FF8C3A" : "1px solid rgba(255,255,255,0.20)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                      }}>
                      {playerName ? (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "white", textAlign: "center" }}>
                          {playerName.split(" ")[0]}
                        </span>
                      ) : (
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.40)" }}>{pos}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Player picker bottom sheet */}
              {showPlayerPicker && (
                <div style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "flex-end",
                }}>
                  <div style={{
                    width: "100%",
                    background: "rgba(28,14,4,0.98)",
                    borderRadius: "20px 20px 0 0",
                    padding: "20px 16px 32px",
                    maxHeight: "60vh",
                    overflow: "auto",
                  }}>
                    <div style={{ height: "4px", width: "36px", background: "rgba(255,255,255,0.20)", borderRadius: "2px", margin: "0 auto 16px" }} />
                    <p style={LABEL_STYLE}>Speler selecteren</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {activePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleSelectPlayer(player.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: "rgba(255,255,255,0.06)",
                            border: "0.5px solid rgba(255,255,255,0.10)",
                            borderRadius: "10px",
                            cursor: "pointer",
                            color: "white",
                            fontSize: "14px",
                          }}
                        >
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "rgba(255,107,0,0.20)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#FF8C3A",
                          }}>
                            {player.shirt_number || "—"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{player.name}</div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.50)" }}>{player.position}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowPlayerPicker(false)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        border: "0.5px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px",
                        marginTop: "16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      Sluiten
                    </button>
                  </div>
                </div>
              )}

              {/* Substitutes */}
              <div>
                <div style={LABEL_STYLE}>Wissels</div>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                  {availableSubstitutes.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => toggleSubstitute(player.id)}
                      style={{
                        whiteSpace: "nowrap",
                        padding: "6px 12px",
                        background: "rgba(255,107,0,0.12)",
                        color: "#FF8C3A",
                        border: "0.5px solid rgba(255,107,0,0.30)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + {player.name}
                    </button>
                  ))}
                  {currentSubstitutes.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => toggleSubstitute(player.id)}
                      style={{
                        whiteSpace: "nowrap",
                        padding: "6px 12px",
                        background: "rgba(255,107,0,0.25)",
                        color: "#FF8C3A",
                        border: "0.5px solid rgba(255,107,0,0.50)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✓ {player.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                style={{
                  background: "#FF6B00",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  height: "52px",
                  fontSize: "16px",
                  fontWeight: 600,
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Opslaan
              </button>
            </div>
          )}

          {/* TACTIEK TAB */}
          {activeTab === "tactiek" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "ball_possession", label: "Balbezit (BB)" },
                { key: "pressing", label: "Pressing (VB)" },
                { key: "transition", label: "Omschakeling" },
                { key: "set_pieces", label: "Dode spelmomenten" },
                { key: "notes", label: "Extra notities" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "0.5px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setExpandedTactic(expandedTactic === key ? null : key)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                    <ChevronDown size={16} style={{
                      transform: expandedTactic === key ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }} />
                  </button>
                  {expandedTactic === key && (
                    <div style={{
                      padding: "12px 16px 16px",
                      borderTop: "0.5px solid rgba(255,255,255,0.08)",
                    }}>
                      <textarea
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        placeholder={`Voer ${label.toLowerCase()} in...`}
                        style={{
                          ...INPUT_STYLE,
                          width: "100%",
                          minHeight: "120px",
                          resize: "none",
                          padding: "12px 16px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleSave}
                style={{
                  background: "#FF6B00",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  height: "52px",
                  fontSize: "16px",
                  fontWeight: 600,
                  width: "100%",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Opslaan
              </button>
            </div>
          )}

          {/* NOTITIES TAB */}
          {activeTab === "notities" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Wedstrijdnotities..."
                style={{
                  ...INPUT_STYLE,
                  width: "100%",
                  minHeight: "300px",
                  resize: "none",
                  padding: "12px 16px",
                }}
              />

              <button
                onClick={handleSave}
                style={{
                  background: "#FF6B00",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  height: "52px",
                  fontSize: "16px",
                  fontWeight: 600,
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Opslaan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}