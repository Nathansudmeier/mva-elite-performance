import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function FeedbackOverview() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: allFeedback = [] } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => base44.entities.Feedback.list(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (feedbackId) => base44.entities.Feedback.update(feedbackId, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: (feedbackId) => base44.entities.Feedback.update(feedbackId, { is_read: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const filteredFeedback = allFeedback.filter(fb => {
    const typeMatch = selectedType === "all" || fb.type === selectedType;
    const statusMatch = selectedStatus === "all" || 
      (selectedStatus === "unread" && !fb.is_read) ||
      (selectedStatus === "read" && fb.is_read);
    return typeMatch && statusMatch;
  });

  const getTypeColor = (type) => {
    switch(type) {
      case "vraag": return "#60a5fa";
      case "tip": return "#8b5cf6";
      case "opmerking": return "#f59e0b";
      default: return "#gray";
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case "vraag": return "❓ Vraag";
      case "tip": return "💡 Tip";
      case "opmerking": return "📝 Opmerking";
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="pb-8">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#1a1a1a", marginBottom: "16px" }}>
          📋 Feedback Overzicht
        </h1>

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "2px solid #1a1a1a",
                fontSize: "12px",
                fontWeight: 600,
                background: "#ffffff",
                cursor: "pointer"
              }}
            >
              <option value="all">Alle types</option>
              <option value="vraag">❓ Vragen</option>
              <option value="tip">💡 Tips</option>
              <option value="opmerking">📝 Opmerkingen</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "2px solid #1a1a1a",
                fontSize: "12px",
                fontWeight: 600,
                background: "#ffffff",
                cursor: "pointer"
              }}
            >
              <option value="all">Alle berichten</option>
              <option value="unread">Ongelezen</option>
              <option value="read">Gelezen</option>
            </select>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)" }}>
          {filteredFeedback.length} bericht{filteredFeedback.length !== 1 ? "en" : ""}
        </p>
      </div>

      {/* Feedback list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredFeedback.length === 0 ? (
          <div style={{
            background: "#ffffff",
            border: "2.5px solid #1a1a1a",
            borderRadius: "18px",
            boxShadow: "3px 3px 0 #1a1a1a",
            padding: "24px",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "14px", color: "rgba(26,26,26,0.55)" }}>
              Geen feedback gevonden
            </p>
          </div>
        ) : (
          filteredFeedback.map((feedback) => (
            <div
              key={feedback.id}
              style={{
                background: feedback.is_read ? "#ffffff" : "rgba(255,104,0,0.08)",
                border: "2.5px solid #1a1a1a",
                borderRadius: "18px",
                boxShadow: "3px 3px 0 #1a1a1a",
                padding: "16px",
                transition: "all 0.2s"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
                  <div style={{
                    background: getTypeColor(feedback.type) + "20",
                    border: "1.5px solid " + getTypeColor(feedback.type),
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: getTypeColor(feedback.type)
                  }}>
                    {getTypeLabel(feedback.type)}
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#1a1a1a", marginBottom: "2px" }}>
                      {feedback.user_name}
                    </p>
                    <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.55)" }}>
                      {feedback.user_email}
                    </p>
                  </div>
                </div>
                {!feedback.is_read && (
                  <div style={{
                    width: "10px",
                    height: "10px",
                    background: "#FF6800",
                    borderRadius: "50%",
                    flexShrink: 0
                  }} />
                )}
              </div>

              {/* Message */}
              <p style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#1a1a1a",
                lineHeight: 1.5,
                marginBottom: "12px",
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "10px"
              }}>
                {feedback.message}
              </p>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.55)" }}>
                  {formatDate(feedback.created_date)}
                </p>
                <button
                  onClick={() => {
                    if (feedback.is_read) {
                      markAsUnreadMutation.mutate(feedback.id);
                    } else {
                      markAsReadMutation.mutate(feedback.id);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #1a1a1a",
                    background: feedback.is_read ? "#ffffff" : "#FF6800",
                    color: feedback.is_read ? "#1a1a1a" : "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.1s"
                  }}
                >
                  {feedback.is_read ? "Ongelezen" : "Gelezen"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}