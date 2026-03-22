import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { getISOWeek, startOfISOWeek, addDays, format } from "date-fns";
import { nl } from "date-fns/locale";

function getWeekBounds(weekStart) {
  const monday = new Date(weekStart);
  const saturday = addDays(monday, 5);
  return { monday, saturday };
}

function ReflectieModal({ existing, onClose, user }) {
  const queryClient = useQueryClient();
  const now = new Date();
  const monday = startOfISOWeek(now);
  const saturday = addDays(monday, 5);
  const weekNumber = getISOWeek(now);
  const year = now.getFullYear();
  const weekStart = format(monday, "yyyy-MM-dd");
  const weekEnd = format(saturday, "yyyy-MM-dd");

  const [text, setText] = useState(existing?.content || "");

  const mutation = useMutation({
    mutationFn: (content) => {
      const data = {
        trainer_email: user.email,
        trainer_name: user.full_name,
        week_number: existing?.week_number ?? weekNumber,
        year: existing?.year ?? year,
        week_start: existing?.week_start ?? weekStart,
        week_end: existing?.week_end ?? weekEnd,
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

  const wn = existing?.week_number ?? weekNumber;
  const ws = existing?.week_start ? new Date(existing.week_start) : monday;
  const we = existing?.week_end ? new Date(existing.week_end) : saturday;
  const title = `Weekreflectie ${wn} · ${format(ws, "d MMM", { locale: nl })} – ${format(we, "d MMM", { locale: nl })}`;

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

function ReflectieKaart({ item, canEdit, onEdit }) {
  const [open, setOpen] = useState(false);
  const { monday, saturday } = getWeekBounds(item.week_start);
  const title = `Week ${item.week_number} · ${format(monday, "d MMM", { locale: nl })} – ${format(saturday, "d MMM", { locale: nl })}`;
  const preview = item.content.slice(0, 150);
  const hasMore = item.content.length > 150;

  return (
    <div
      className="glass p-4 cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start justify-between gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "4px" }}>{title}</p>
          {item.trainer_name && (
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginBottom: "6px" }}>{item.trainer_name}</p>
          )}
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            {open ? item.content : preview}{!open && hasMore && "..."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {canEdit && (
            <button
              onClick={() => onEdit(item)}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}
            >
              Bewerken
            </button>
          )}
          <i className={`ti ti-chevron-down`} style={{ fontSize: "16px", color: "rgba(255,255,255,0.40)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </div>
    </div>
  );
}

export default function MijnReflecties() {
  const { user, isTrainer, isLoading } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const { data: reflections = [] } = useQuery({
    queryKey: ["trainerReflections"],
    queryFn: () => base44.entities.TrainerReflection.list("-week_start"),
    enabled: !isLoading && (isTrainer || isAdmin),
  });

  if (!isTrainer && !isAdmin) {
    return (
      <div className="glass p-8 text-center">
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>Geen toegang</p>
      </div>
    );
  }

  // Trainers see only their own; admins see all
  const visible = isAdmin
    ? reflections
    : reflections.filter(r => r.trainer_email === user?.email);

  const filtered = search
    ? visible.filter(r => r.content.toLowerCase().includes(search.toLowerCase()))
    : visible;

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mijn reflecties</h1>
        {isTrainer && !isAdmin && (
          <button
            onClick={() => { setEditItem(null); setModalOpen(true); }}
            style={{ background: "#FF6B00", color: "#ffffff", border: "none", borderRadius: "12px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="ti ti-plus" style={{ fontSize: "15px" }} /> Nieuwe reflectie
          </button>
        )}
      </div>

      {/* Zoekbalk */}
      <div style={{ position: "relative" }}>
        <i className="ti ti-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "rgba(255,255,255,0.35)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek in reflecties..."
          style={{
            width: "100%",
            paddingLeft: "38px",
            paddingRight: "12px",
            height: "44px",
            background: "rgba(255,255,255,0.07)",
            border: "0.5px solid rgba(255,255,255,0.15)",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#ffffff",
            outline: "none",
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass flex items-center justify-center h-40">
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.40)" }}>
            {search ? "Geen resultaten gevonden" : "Nog geen weekreflecties geschreven"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <ReflectieKaart
              key={item.id}
              item={item}
              canEdit={isTrainer && item.trainer_email === user?.email}
              onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ReflectieModal
          existing={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          user={user}
        />
      )}
    </div>
  );
}