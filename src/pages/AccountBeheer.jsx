import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, UserCheck, Link as LinkIcon, Upload } from "lucide-react";

export default function AccountBeheer() {
  return (
    <RoleGuard allowedRoles={["trainer"]}>
      <AccountBeheerContent />
    </RoleGuard>
  );
}

function AccountBeheerContent() {
  const queryClient = useQueryClient();

  // Invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("speelster");
  const [invitePlayerId, setInvitePlayerId] = useState("");
  const [inviting, setInviting] = useState(false);

  // Link dialog state
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUser, setLinkUser] = useState(null);
  const [linkPlayerId, setLinkPlayerId] = useState("");
  const [linkTrainerId, setLinkTrainerId] = useState("");

  // New trainer profile state
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

  const handleInvite = async () => {
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, "user");
    // Role and player_id will be set manually via the Koppel button after the user accepts the invite
    setInviting(false);
    setInviteOpen(false);
    setInviteEmail("");
    setInvitePlayerId("");
    queryClient.invalidateQueries(["users"]);
  };

  const linkMutation = useMutation({
    mutationFn: () => {
      if (linkRole === "trainer") {
        return base44.entities.User.update(linkUser.id, { role: linkRole, trainer_id: linkTrainerId, player_id: "" });
      }
      return base44.entities.User.update(linkUser.id, { role: linkRole, player_id: linkPlayerId, trainer_id: "" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setLinkOpen(false);
      setLinkUser(null);
      setLinkPlayerId("");
      setLinkTrainerId("");
      setLinkRole("");
    }
  });

  const [linkRole, setLinkRole] = useState("");

  const openLink = (user) => {
    setLinkUser(user);
    setLinkRole(user.role || "speelster");
    setLinkPlayerId(user.player_id || "");
    setLinkTrainerId(user.trainer_id || "");
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
    setNewTrainerName("");
    setNewTrainerTitle("");
    setNewTrainerPhone("");
    setNewTrainerPhoto("");
    queryClient.invalidateQueries(["trainers"]);
    // If opened from link dialog, auto-select the new trainer
    if (linkOpen && created?.id) {
      setLinkTrainerId(created.id);
    }
  };

  const getLinkedPlayer = (u) => {
    if (!u?.player_id) return null;
    return players.find(p => p.id === u.player_id);
  };

  const getLinkedTrainer = (u) => {
    if (!u?.trainer_id) return null;
    return trainers.find(t => t.id === u.trainer_id);
  };

  const speelsters = users.filter(u => u.role === "speelster");
  const trainerUsers = users.filter(u => u.role === "trainer");
  const ongekoppeld = users.filter(u => u.role !== "speelster" && u.role !== "trainer" && u.role !== "admin");

  const inputStyle = { background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" };
  const selectStyle = { background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" };
  const dialogStyle = { background: "rgba(20,10,2,0.97)", border: "0.5px solid rgba(255,255,255,0.12)" };

  const UserRow = ({ u, linked, onLink, linkLabel }) => (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden shrink-0" style={{ background: "rgba(255,107,0,0.15)", color: "#FF8C3A" }}>
        {linked?.photo_url ? <img src={linked.photo_url} alt="" className="w-full h-full object-cover" /> : (u.full_name?.[0] || u.email?.[0])}
      </div>
      <div className="flex-1 min-w-0">
        <p className="t-card-title truncate">{u.full_name || u.email}</p>
        <p className="t-tertiary truncate">{u.email}</p>
        {linked ? (
          <p className="flex items-center gap-1 mt-0.5" style={{ fontSize: "11px", color: "#FF8C3A" }}>
            <UserCheck size={10} /> {linkLabel}
          </p>
        ) : (
          <p style={{ fontSize: "11px", color: "#f87171", marginTop: "2px" }}>Niet gekoppeld</p>
        )}
      </div>
      <button onClick={() => onLink(u)} className="badge" style={{ background: "rgba(255,107,0,0.12)", color: "#FF8C3A", border: "0.5px solid rgba(255,107,0,0.25)", cursor: "pointer", height: "30px" }}>
        <LinkIcon size={10} className="mr-1" /> Koppel
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page-title">Accountbeheer</h1>
          <p className="t-secondary">{speelsters.length} speelsters · {trainerUsers.length} trainers</p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-secondary">
          <Plus size={14} /> Uitnodigen
        </button>
      </div>

      {trainerUsers.length > 0 && (
        <div className="glass p-4">
          <p className="t-label mb-3">Trainers</p>
          <div>{trainerUsers.map(u => { const linked = getLinkedTrainer(u); return <UserRow key={u.id} u={u} linked={linked} onLink={openLink} linkLabel={`${linked?.name}${linked?.role_title ? ` · ${linked.role_title}` : ""}`} />; })}</div>
        </div>
      )}

      <div className="glass p-4">
        <p className="t-label mb-3">Speelsters</p>
        {speelsters.length === 0 ? <p className="t-tertiary">Nog geen speelster-accounts aangemaakt.</p> : (
          <div>{speelsters.map(u => { const linked = getLinkedPlayer(u); return <UserRow key={u.id} u={u} linked={linked} onLink={openLink} linkLabel={`Gekoppeld aan ${linked?.name}`} />; })}</div>
        )}
      </div>

      {ongekoppeld.length > 0 && (
        <div className="glass p-4">
          <p className="t-label mb-3">Ongekoppeld</p>
          <div>{ongekoppeld.map(u => <UserRow key={u.id} u={u} linked={null} onLink={openLink} linkLabel="" />)}</div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm" style={dialogStyle}>
          <DialogHeader><DialogTitle className="t-page-title">Gebruiker Uitnodigen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="t-label mb-1 block">E-mailadres *</label>
              <Input placeholder="naam@email.nl" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="t-label mb-1 block">Rol</label>
              <Select value={inviteRole} onValueChange={v => { setInviteRole(v); setInvitePlayerId(""); }}>
                <SelectTrigger style={selectStyle}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="speelster">Speelster</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteRole === "speelster" && (
              <div>
                <label className="t-label mb-1 block">Koppel aan speelster</label>
                <Select value={invitePlayerId} onValueChange={setInvitePlayerId}>
                  <SelectTrigger style={selectStyle}><SelectValue placeholder="Selecteer spelersprofiel…" /></SelectTrigger>
                  <SelectContent>
                    {players.filter(p => p.active !== false).map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.shirt_number ? ` (#${p.shirt_number})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="t-tertiary mt-1">Optioneel — je kunt dit later ook nog koppelen.</p>
              </div>
            )}
            <p className="t-tertiary">De gebruiker ontvangt een uitnodigingsmail om een wachtwoord in te stellen.</p>
            <button onClick={handleInvite} disabled={inviting || !inviteEmail} className="btn-primary">{inviting ? "Uitnodigen..." : "Uitnodiging Versturen"}</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm" style={dialogStyle}>
          <DialogHeader><DialogTitle className="t-page-title">Gebruiker Bewerken</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="t-secondary">Account: <strong className="text-white">{linkUser?.full_name || linkUser?.email}</strong></p>
            <div>
              <label className="t-label mb-1 block">Rol</label>
              <Select value={linkRole} onValueChange={(v) => { setLinkRole(v); setLinkPlayerId(""); setLinkTrainerId(""); }}>
                <SelectTrigger style={selectStyle}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="speelster">Speelster</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkRole === "trainer" ? (
              <div>
                <label className="t-label mb-1 block">Koppel aan trainersprofiel</label>
                <Select value={linkTrainerId} onValueChange={setLinkTrainerId}>
                  <SelectTrigger style={selectStyle}><SelectValue placeholder="Selecteer trainersprofiel…" /></SelectTrigger>
                  <SelectContent>{trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}{t.role_title ? ` · ${t.role_title}` : ""}</SelectItem>)}</SelectContent>
                </Select>
                <button onClick={() => setNewTrainerOpen(true)} className="btn-secondary w-full mt-2" style={{ width: "100%" }}>
                  <Plus size={14} /> Nieuw trainersprofiel aanmaken
                </button>
              </div>
            ) : linkRole === "speelster" ? (
              <div>
                <label className="t-label mb-1 block">Koppel aan spelersprofiel</label>
                <Select value={linkPlayerId} onValueChange={setLinkPlayerId}>
                  <SelectTrigger style={selectStyle}><SelectValue placeholder="Selecteer spelersprofiel…" /></SelectTrigger>
                  <SelectContent>{players.filter(p => p.active !== false).map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.shirt_number ? ` (#${p.shirt_number})` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
            <button onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending} className="btn-primary">{linkMutation.isPending ? "Opslaan..." : "Opslaan"}</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Trainer Profile Dialog */}
      <Dialog open={newTrainerOpen} onOpenChange={setNewTrainerOpen}>
        <DialogContent className="max-w-sm" style={dialogStyle}>
          <DialogHeader><DialogTitle className="t-page-title">Nieuw Trainersprofiel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl shrink-0" style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
                {newTrainerPhoto ? <img src={newTrainerPhoto} alt="" className="w-full h-full object-cover" /> : (newTrainerName?.[0] || "?")}
              </div>
              <label className="cursor-pointer btn-secondary" style={{ height: "36px", fontSize: "13px" }}>
                <Upload size={14} />
                {uploadingPhoto ? "Uploaden..." : "Foto uploaden"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <div><label className="t-label mb-1 block">Naam *</label><Input placeholder="Volledige naam" value={newTrainerName} onChange={e => setNewTrainerName(e.target.value)} style={inputStyle} /></div>
            <div><label className="t-label mb-1 block">Functietitel</label><Input placeholder="bijv. Hoofdtrainer, Assistent" value={newTrainerTitle} onChange={e => setNewTrainerTitle(e.target.value)} style={inputStyle} /></div>
            <div><label className="t-label mb-1 block">Telefoonnummer</label><Input placeholder="+31 6 ..." value={newTrainerPhone} onChange={e => setNewTrainerPhone(e.target.value)} style={inputStyle} /></div>
            <button onClick={handleCreateTrainer} disabled={savingTrainer || !newTrainerName} className="btn-primary">{savingTrainer ? "Opslaan..." : "Profiel Aanmaken"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}