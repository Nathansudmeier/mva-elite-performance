import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RoleGuard from "@/components/auth/RoleGuard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Plus, Link as LinkIcon, Upload, Users, UserCheck, AlertCircle } from "lucide-react";

export default function AccountBeheer() {
  return (
    <RoleGuard allowedRoles={["trainer"]}>
      <AccountBeheerContent />
    </RoleGuard>
  );
}

const LABEL_STYLE = {
  fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)",
  textTransform: "uppercase", letterSpacing: "0.10em",
  display: "block", marginBottom: "6px",
};

const INPUT_STYLE = {
  background: "#ffffff", border: "2.5px solid #1a1a1a",
  color: "#1a1a1a", borderRadius: "14px",
};

const SELECT_STYLE = {
  background: "#ffffff", border: "2.5px solid #1a1a1a",
  color: "#1a1a1a", borderRadius: "14px",
};

const DIALOG_STYLE = {
  background: "#ffffff", border: "2.5px solid #1a1a1a",
  borderRadius: "22px", boxShadow: "4px 4px 0 #1a1a1a",
};

function Avatar({ user, linked }) {
  const initials = (user.full_name || user.email || "?")[0].toUpperCase();
  return (
    <div style={{
      width: "40px", height: "40px", borderRadius: "50%",
      background: "#FF6800", border: "2px solid #1a1a1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden",
    }}>
      {linked?.photo_url
        ? <img src={linked.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff" }}>{initials}</span>
      }
    </div>
  );
}

function UserRow({ u, linked, onLink, linkLabel }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 0",
      borderBottom: "1.5px solid rgba(26,26,26,0.07)",
    }}>
      <Avatar user={u} linked={linked} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, marginBottom: "2px" }}>
          {u.full_name || u.email}
        </p>
        <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {u.email}
        </p>
        {linked ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <UserCheck size={10} style={{ color: "#08D068" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#08D068" }}>{linkLabel}</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <AlertCircle size={10} style={{ color: "#FF3DA8" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF3DA8" }}>Niet gekoppeld</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onLink(u)}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "6px 14px", borderRadius: "20px",
          background: "#ffffff", border: "2px solid #1a1a1a",
          fontSize: "11px", fontWeight: 800, color: "#1a1a1a",
          cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a",
          flexShrink: 0,
          transition: "box-shadow 0.1s, transform 0.1s",
        }}
        onMouseDown={e => { e.currentTarget.style.boxShadow = "0px 0px 0 #1a1a1a"; e.currentTarget.style.transform = "translate(2px,2px)"; }}
        onMouseUp={e => { e.currentTarget.style.boxShadow = "2px 2px 0 #1a1a1a"; e.currentTarget.style.transform = ""; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "2px 2px 0 #1a1a1a"; e.currentTarget.style.transform = ""; }}
      >
        <LinkIcon size={10} /> Bewerk
      </button>
    </div>
  );
}

function SectionCard({ title, count, color = "#FF6800", children }) {
  return (
    <div style={{
      background: "#ffffff", border: "2.5px solid #1a1a1a",
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: "2px solid rgba(26,26,26,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: color, border: "1.5px solid #1a1a1a",
          }} />
          <span style={{ fontSize: "11px", fontWeight: 900, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {title}
          </span>
        </div>
        <span style={{
          background: color, border: "1.5px solid #1a1a1a", borderRadius: "20px",
          padding: "2px 10px", fontSize: "10px", fontWeight: 900, color: "#ffffff",
          boxShadow: "1px 1px 0 #1a1a1a",
        }}>
          {count}
        </span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {children}
      </div>
    </div>
  );
}

function AccountBeheerContent() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("speelster");
  const [invitePlayerId, setInvitePlayerId] = useState("");
  const [inviting, setInviting] = useState(false);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUser, setLinkUser] = useState(null);
  const [linkPlayerId, setLinkPlayerId] = useState("");
  const [linkTrainerId, setLinkTrainerId] = useState("");
  const [linkRole, setLinkRole] = useState("");

  const [newTrainerOpen, setNewTrainerOpen] = useState(false);
  const [newTrainerName, setNewTrainerName] = useState("");
  const [newTrainerTitle, setNewTrainerTitle] = useState("");
  const [newTrainerPhone, setNewTrainerPhone] = useState("");
  const [newTrainerPhoto, setNewTrainerPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingTrainer, setSavingTrainer] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers", {});
      return res.data || [];
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ["trainers"],
    queryFn: () => base44.entities.Trainer.list(),
  });

  const getRole = (u) => u.data?.role || u.role;
  const getPlayerId = (u) => u.data?.player_id || u.player_id || "";
  const getTrainerId = (u) => u.data?.trainer_id || u.trainer_id || "";

  const getLinkedPlayer = (u) => {
    const pid = getPlayerId(u);
    return pid ? players.find(p => p.id === pid) : null;
  };

  const getLinkedTrainer = (u) => {
    const tid = getTrainerId(u);
    return tid ? trainers.find(t => t.id === tid) : null;
  };

  const handleInvite = async () => {
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, "user");
    setInviting(false);
    setInviteOpen(false);
    setInviteEmail("");
    setInvitePlayerId("");
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const linkMutation = useMutation({
    mutationFn: () => base44.functions.invoke("updateUserLink", {
      userId: linkUser.id,
      player_id: (linkRole === "speelster" || linkRole === "ouder") ? linkPlayerId : "",
      trainer_id: linkRole === "trainer" ? linkTrainerId : "",
      role: linkRole,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setLinkOpen(false);
      setLinkUser(null);
      setLinkPlayerId("");
      setLinkTrainerId("");
      setLinkRole("");
    },
  });

  const openLink = (user) => {
    setLinkUser(user);
    setLinkRole(getRole(user) === "admin" ? "admin" : getPlayerId(user) ? "speelster" : getTrainerId(user) ? "trainer" : "speelster");
    setLinkPlayerId(getPlayerId(user));
    setLinkTrainerId(getTrainerId(user));
    setLinkOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setNewTrainerPhoto(file_url);
    setUploadingPhoto(false);
  };

  const handleCreateTrainer = async () => {
    setSavingTrainer(true);
    const created = await base44.entities.Trainer.create({
      name: newTrainerName,
      role_title: newTrainerTitle,
      phone: newTrainerPhone,
      photo_url: newTrainerPhoto,
    });
    setSavingTrainer(false);
    setNewTrainerOpen(false);
    setNewTrainerName(""); setNewTrainerTitle(""); setNewTrainerPhone(""); setNewTrainerPhoto("");
    queryClient.invalidateQueries({ queryKey: ["trainers"] });
    if (linkOpen && created?.id) setLinkTrainerId(created.id);
  };

  const speelsters = users.filter(u => getPlayerId(u) && !getTrainerId(u) && getRole(u) !== "admin" && getRole(u) !== "ouder");
  const ouders = users.filter(u => getRole(u) === "ouder");
  const trainerUsers = users.filter(u => getTrainerId(u) && getRole(u) !== "admin");
  const ongekoppeld = users.filter(u => !getPlayerId(u) && !getTrainerId(u) && getRole(u) !== "admin" && getRole(u) !== "ouder");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "80px" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "#FF6800", border: "2.5px solid #1a1a1a", borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a", padding: "1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "4px" }}>
            Beheer
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1, margin: 0 }}>
            Accountbeheer
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", fontWeight: 600, marginTop: "4px" }}>
            {speelsters.length} speelsters · {trainerUsers.length} trainers · {ouders.length} ouders
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "10px 16px", borderRadius: "14px",
            background: "#FF6800", border: "2.5px solid rgba(255,255,255,0.30)",
            color: "#ffffff", fontSize: "13px", fontWeight: 800,
            cursor: "pointer", flexShrink: 0,
            boxShadow: "2px 2px 0 rgba(255,255,255,0.15)",
          }}
        >
          <Plus size={15} /> Uitnodigen
        </button>
      </div>

      {/* ── STAT PILLS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {[
          { label: "Speelsters", count: speelsters.length, color: "#00C2FF" },
          { label: "Trainers", count: trainerUsers.length, color: "#FF6800" },
          { label: "Ouders", count: ouders.length, color: "#9B5CFF" },
          { label: "Ongekoppeld", count: ongekoppeld.length, color: ongekoppeld.length > 0 ? "#FF3DA8" : "#08D068" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            background: "#ffffff", border: "2.5px solid #1a1a1a", borderRadius: "14px",
            boxShadow: "3px 3px 0 #1a1a1a", padding: "12px 10px", textAlign: "center",
          }}>
            <p style={{ fontSize: "22px", fontWeight: 900, color, letterSpacing: "-1px", lineHeight: 1, marginBottom: "4px" }}>{count}</p>
            <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.50)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── TRAINERS ── */}
      {trainerUsers.length > 0 && (
        <SectionCard title="Trainers" count={trainerUsers.length} color="#FF6800">
          {trainerUsers.map((u, i) => {
            const linked = getLinkedTrainer(u);
            return (
              <div key={u.id} style={{ borderBottom: i < trainerUsers.length - 1 ? "none" : "none" }}>
                <UserRow u={u} linked={linked} onLink={openLink} linkLabel={`${linked?.name}${linked?.role_title ? ` · ${linked.role_title}` : ""}`} />
              </div>
            );
          })}
          {/* Remove last border */}
          <style>{`.last-row { border-bottom: none !important; }`}</style>
        </SectionCard>
      )}

      {/* ── SPEELSTERS ── */}
      <SectionCard title="Speelsters" count={speelsters.length} color="#00C2FF">
        {speelsters.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Users size={28} style={{ color: "rgba(26,26,26,0.15)", margin: "0 auto 8px" }} />
            <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.35)", fontWeight: 600 }}>Nog geen speelster-accounts aangemaakt.</p>
          </div>
        ) : speelsters.map((u, i) => {
          const linked = getLinkedPlayer(u);
          return <UserRow key={u.id} u={u} linked={linked} onLink={openLink} linkLabel={linked ? `Gekoppeld aan ${linked.name}` : ""} />;
        })}
      </SectionCard>

      {/* ── OUDERS ── */}
      {ouders.length > 0 && (
        <SectionCard title="Ouders" count={ouders.length} color="#9B5CFF">
          {ouders.map(u => {
            const linked = getLinkedPlayer(u);
            return <UserRow key={u.id} u={u} linked={linked} onLink={openLink} linkLabel={linked ? `Gekoppeld aan ${linked.name}` : ""} />;
          })}
        </SectionCard>
      )}

      {/* ── ONGEKOPPELD ── */}
      {ongekoppeld.length > 0 && (
        <SectionCard title="Ongekoppeld" count={ongekoppeld.length} color="#FF3DA8">
          {ongekoppeld.map(u => (
            <UserRow key={u.id} u={u} linked={null} onLink={openLink} linkLabel="" />
          ))}
        </SectionCard>
      )}

      {/* ══════════════════════════════════
          DIALOGEN
      ══════════════════════════════════ */}

      {/* Uitnodigen */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm" style={DIALOG_STYLE}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
              Gebruiker uitnodigen
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={LABEL_STYLE}>E-mailadres *</label>
              <Input placeholder="naam@email.nl" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Rol</label>
              <Select value={inviteRole} onValueChange={v => { setInviteRole(v); setInvitePlayerId(""); }}>
                <SelectTrigger style={SELECT_STYLE}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="speelster">Speelster</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="ouder">Ouder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(inviteRole === "speelster" || inviteRole === "ouder") && (
              <div>
                <label style={LABEL_STYLE}>{inviteRole === "ouder" ? "Koppel aan kind" : "Koppel aan speelster"}</label>
                <Select value={invitePlayerId} onValueChange={setInvitePlayerId}>
                  <SelectTrigger style={SELECT_STYLE}><SelectValue placeholder="Selecteer profiel…" /></SelectTrigger>
                  <SelectContent>
                    {players.filter(p => p.active !== false).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.shirt_number ? ` (#${p.shirt_number})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", marginTop: "4px", fontWeight: 600 }}>Optioneel — je kunt dit later ook koppelen.</p>
              </div>
            )}
            <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", lineHeight: 1.5 }}>
              De gebruiker ontvangt een uitnodigingsmail om een wachtwoord in te stellen.
            </p>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail}
              className="btn-primary"
            >
              {inviting ? "Uitnodigen..." : "Uitnodiging versturen"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bewerken / Koppelen */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm" style={DIALOG_STYLE}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
              Gebruiker bewerken
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              background: "rgba(26,26,26,0.04)", border: "1.5px solid rgba(26,26,26,0.10)",
              borderRadius: "12px", padding: "10px 14px",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{linkUser?.full_name || linkUser?.email}</p>
              <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.45)", marginTop: "2px" }}>{linkUser?.email}</p>
            </div>
            <div>
              <label style={LABEL_STYLE}>Rol</label>
              <Select value={linkRole} onValueChange={(v) => { setLinkRole(v); setLinkPlayerId(""); setLinkTrainerId(""); }}>
                <SelectTrigger style={SELECT_STYLE}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="speelster">Speelster</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="ouder">Ouder</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkRole === "trainer" && (
              <div>
                <label style={LABEL_STYLE}>Koppel aan trainersprofiel</label>
                <Select value={linkTrainerId} onValueChange={setLinkTrainerId}>
                  <SelectTrigger style={SELECT_STYLE}><SelectValue placeholder="Selecteer trainersprofiel…" /></SelectTrigger>
                  <SelectContent>
                    {trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}{t.role_title ? ` · ${t.role_title}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => setNewTrainerOpen(true)}
                  className="btn-secondary"
                  style={{ marginTop: "8px", width: "100%", height: "40px", fontSize: "13px" }}
                >
                  <Plus size={13} /> Nieuw trainersprofiel
                </button>
              </div>
            )}
            {(linkRole === "speelster" || linkRole === "ouder") && (
              <div>
                <label style={LABEL_STYLE}>{linkRole === "ouder" ? "Koppel aan kind" : "Koppel aan spelersprofiel"}</label>
                <Select value={linkPlayerId} onValueChange={setLinkPlayerId}>
                  <SelectTrigger style={SELECT_STYLE}><SelectValue placeholder={`Selecteer ${linkRole === "ouder" ? "kind" : "spelersprofiel"}…`} /></SelectTrigger>
                  <SelectContent>
                    {players.filter(p => p.active !== false).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.shirt_number ? ` (#${p.shirt_number})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <button
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending}
              className="btn-primary"
            >
              {linkMutation.isPending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nieuw trainersprofiel */}
      <Dialog open={newTrainerOpen} onOpenChange={setNewTrainerOpen}>
        <DialogContent className="max-w-sm" style={DIALOG_STYLE}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
              Nieuw trainersprofiel
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%",
                background: "rgba(26,26,26,0.08)", border: "2.5px solid #1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
              }}>
                {newTrainerPhoto
                  ? <img src={newTrainerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: "18px", fontWeight: 900, color: "rgba(26,26,26,0.30)" }}>{newTrainerName?.[0] || "?"}</span>
                }
              </div>
              <label style={{ cursor: "pointer" }} className="btn-secondary">
                <Upload size={13} />
                {uploadingPhoto ? "Uploaden..." : "Foto uploaden"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <div>
              <label style={LABEL_STYLE}>Naam *</label>
              <Input placeholder="Volledige naam" value={newTrainerName} onChange={e => setNewTrainerName(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Functietitel</label>
              <Input placeholder="bijv. Hoofdtrainer, Assistent" value={newTrainerTitle} onChange={e => setNewTrainerTitle(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Telefoonnummer</label>
              <Input placeholder="+31 6 ..." value={newTrainerPhone} onChange={e => setNewTrainerPhone(e.target.value)} style={INPUT_STYLE} />
            </div>
            <button
              onClick={handleCreateTrainer}
              disabled={savingTrainer || !newTrainerName}
              className="btn-primary"
            >
              {savingTrainer ? "Opslaan..." : "Profiel aanmaken"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}