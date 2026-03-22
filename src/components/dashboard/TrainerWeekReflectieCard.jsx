import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { getISOWeek, startOfISOWeek, endOfISOWeek, addDays, format } from "date-fns";
import { nl } from "date-fns/locale";

function getWeekBounds() {
  const now = new Date();
  const monday = startOfISOWeek(now);
  const saturday = addDays(monday, 5);
  return {
    weekNumber: getISOWeek(now),
    year: now.getFullYear(),
    weekStart: format(monday, "yyyy-MM-dd"),
    weekEnd: format(saturday, "yyyy-MM-dd"),
    monday,
    saturday,
  };
}

function ReflectieModal({ existing, weekBounds, onClose, user }) {
  const [text, setText] = useState(existing?.content || "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (content) => {
      const data = {
        trainer_email: user.email,
        trainer_name: user.full_name,
        week_number: weekBounds.weekNumber,
        year: weekBounds.year,
        week_start: weekBounds.weekStart,
        week_end: weekBounds.weekEnd,
        content,
      };
      return existing?.id
        ? base44.entities.TrainerReflection.update(existing.id, data)
        : base44.entities.TrainerReflection.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["trainerReflections"]);
      onClose();
    },
  });

  const title = `Weekreflectie ${weekBounds.weekNumber} · ${format(weekBounds.monday, "d MMM", { locale: nl })} – ${format(weekBounds.saturday, "d MMM", { locale: nl })}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="glass-dark modal-scroll-content w-full my-8"
        style={{ maxWidth: "640px", borderRadius: "24px", padding: "2rem", overflowY: "auto", maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer" }}>
            <i className="ti ti-x" style={{ fontSize: "20px", color: "rgba(255,255,255,0.7)" }} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Hoe was jouw week als trainer? Wat ging goed, wat kan beter, wat neem je mee naar volgende week..."
          style={{
            width: "100%",
            minHeight: "300px",
            fontSize: "15px",
            lineHeight: 1.7,
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "1rem",
            color: "#ffffff",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />

        <button
          onClick={() => mutation.mutate(text)}
          disabled={!text.trim() || mutation.isPending}
          style={{
            marginTop: "16px",
            width: "100%",
            height: "48px",
            borderRadius: "14px",
            background: "#FF6B00",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 600,
            border: "none",
            cursor: !text.trim() || mutation.isPending ? "not-allowed" : "pointer",
            opacity: !text.trim() || mutation.isPending ? 0.5 : 1,
          }}
        >
          {mutation.isPending ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </div>
  );
}

export default function TrainerWeekReflectieCard() {
  const { user, isTrainer } = useCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);
  const weekBounds = getWeekBounds();

  const { data: reflections = [] } = useQuery({
    queryKey: ["trainerReflections"],
    queryFn: () => base44.entities.TrainerReflection.list("-week_start"),
    enabled: isTrainer,
  });

  if (!isTrainer) return null;

  const thisWeekReflection = reflections.find(
    r => r.week_number === weekBounds.weekNumber && r.year === weekBounds.year && r.trainer_email === user?.email
  );

  const weekLabel = `Week ${weekBounds.weekNumber} · ${format(weekBounds.monday, "d MMM", { locale: nl })}`;
  const dateRange = `Ma ${format(weekBounds.monday, "d MMM", { locale: nl })} – Za ${format(weekBounds.saturday, "d MMM", { locale: nl })}`;

  return (
    <>
      <div className="glass p-4 flex flex-col" style={{ minHeight: "120px" }}>
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>Mijn weekreflectie</p>
          {thisWeekReflection && (
            <button onClick={() => setModalOpen(true)} style={{ fontSize: "12px", color: "#FF8C3A" }}>Bewerken</button>
          )}
        </div>

        {thisWeekReflection ? (
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "6px" }}>{weekLabel}</p>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              {thisWeekReflection.content.slice(0, 100)}{thisWeekReflection.content.length > 100 && "..."}
            </p>
            {thisWeekReflection.content.length > 100 && (
              <button onClick={() => setModalOpen(true)} style={{ fontSize: "12px", color: "#FF8C3A", marginTop: "6px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Lees meer
              </button>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{dateRange}</p>
            <button
              onClick={() => setModalOpen(true)}
              style={{ background: "#FF6B00", color: "#ffffff", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Schrijf reflectie
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <ReflectieModal
          existing={thisWeekReflection}
          weekBounds={weekBounds}
          onClose={() => setModalOpen(false)}
          user={user}
        />
      )}
    </>
  );
}