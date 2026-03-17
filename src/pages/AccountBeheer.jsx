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
    queryFn: () => base44.entities.User.list(),
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
    const result = await base44.users.inviteUser(inviteEmail, "user");
    if (result?.id) {
      const updateData = { role: inviteRole };
      if (inviteRole === "speelster" && invitePlayerId) updateData.player_id = invitePlayerId;
      await base44.entities.User.update(result.id, updateData);
    }
    setInviting(false);
    setInviteOpen(false);
    setInviteEmail("");
    setInvitePlayerId("");
    queryClient.invalidateQueries(["users"]);
  };

  const linkMutation = useMutation({
    mutationFn: () => {
      if (linkUser.role === "trainer") {
        return base44.entities.User.update(linkUser.id, { trainer_id: linkTrainerId });
      }
      return base44.entities.User.update(linkUser.id, { player_id: linkPlayerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setLinkOpen(false);
      setLinkUser(null);
      setLinkPlayerId("");
      setLinkTrainerId("");
    }
  });

  const openLink = (user) => {
    setLinkUser(user);
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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-500 text-[#FF6B00]">Accountbeheer</h1>
          <p className="text-[#888888] text-sm">{speelsters.length} speelsters · {trainerUsers.length} trainers</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-[#FF6B00] hover:bg-[#E55A00] text-white">
          <Plus size={16} className="mr-1" /> Uitnodigen
        </Button>
      </div>

      {/* Trainers */}
      {trainerUsers.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
          <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-3">Trainers</h2>
          <div className="space-y-2">
            {trainerUsers.map(u => {
              const linked = getLinkedTrainer(u);
              return (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#E8E6E1] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-sm font-500 overflow-hidden shrink-0">
                    {linked?.photo_url ? (
                      <img src={linked.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      u.full_name?.[0] || u.email?.[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-500 text-[#1A1A1A] truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-[#888888] truncate">{u.email}</p>
                    {linked ? (
                      <p className="text-xs text-[#FF6B00] flex items-center gap-1 mt-0.5">
                        <UserCheck size={10} /> {linked.name}{linked.role_title ? ` · ${linked.role_title}` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-[#C0392B] mt-0.5">Niet gekoppeld aan trainersprofiel</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openLink(u)} className="border-[#E8E6E1] text-[#FF6B00] text-xs shrink-0">
                    <LinkIcon size={12} className="mr-1" /> Koppel
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Speelsters */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
        <h2 className="font-500 text-sm uppercase tracking-wide text-[#FF6B00] mb-3">Speelsters</h2>
        {speelsters.length === 0 ? (
          <p className="text-sm text-[#888888]">Nog geen speelster-accounts aangemaakt.</p>
        ) : (
          <div className="space-y-2">
            {speelsters.map(u => {
              const linked = getLinkedPlayer(u);
              return (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#E8E6E1] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#FFF3EB] flex items-center justify-center text-[#FF6B00] text-sm font-500">
                    {u.full_name?.[0] || u.email?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-500 text-[#1A1A1A] truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-[#888888] truncate">{u.email}</p>
                    {linked ? (
                      <p className="text-xs text-[#FF6B00] flex items-center gap-1 mt-0.5">
                        <UserCheck size={10} /> Gekoppeld aan {linked.name}
                      </p>
                    ) : (
                      <p className="text-xs text-[#C0392B] mt-0.5">Niet gekoppeld aan profiel</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openLink(u)} className="border-[#E8E6E1] text-[#FF6B00] text-xs shrink-0">
                    <LinkIcon size={12} className="mr-1" /> Koppel
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm border-[#E8E6E1] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Gebruiker Uitnodigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">E-mailadres *</label>
              <Input placeholder="naam@email.nl" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="border-[#E8E6E1] text-[#1A1A1A] bg-white" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Rol</label>
              <Select value={inviteRole} onValueChange={v => { setInviteRole(v); setInvitePlayerId(""); }}>
                <SelectTrigger className="border-[#E8E6E1] text-[#1A1A1A] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speelster">Speelster</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteRole === "speelster" && (
              <div>
                <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Koppel aan speelster</label>
                <Select value={invitePlayerId} onValueChange={setInvitePlayerId}>
                  <SelectTrigger className="border-[#E8E6E1] text-[#1A1A1A] bg-white">
                    <SelectValue placeholder="Selecteer spelersprofiel…" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.filter(p => p.active !== false).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.shirt_number ? ` (#${p.shirt_number})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#AAAAAA] mt-1">Optioneel — je kunt dit later ook nog koppelen.</p>
              </div>
            )}
            <p className="text-xs text-[#888888]">De gebruiker ontvangt een uitnodigingsmail om een wachtwoord in te stellen.</p>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white">
              {inviting ? "Uitnodigen..." : "Uitnodiging Versturen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm border-[#E8E6E1] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">
              {linkUser?.role === "trainer" ? "Koppel aan Trainersprofiel" : "Koppel aan Spelersprofiel"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#888888]">Account: <strong className="text-[#1A1A1A]">{linkUser?.full_name || linkUser?.email}</strong></p>

            {linkUser?.role === "trainer" ? (
              <>
                <Select value={linkTrainerId} onValueChange={setLinkTrainerId}>
                  <SelectTrigger className="border-[#E8E6E1] text-[#1A1A1A] bg-white">
                    <SelectValue placeholder="Selecteer trainersprofiel…" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}{t.role_title ? ` · ${t.role_title}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setNewTrainerOpen(true)} className="w-full border-dashed border-[#FF6B00] text-[#FF6B00]">
                  <Plus size={14} className="mr-1" /> Nieuw trainersprofiel aanmaken
                </Button>
              </>
            ) : (
              <Select value={linkPlayerId} onValueChange={setLinkPlayerId}>
                <SelectTrigger className="border-[#E8E6E1] text-[#1A1A1A] bg-white">
                  <SelectValue placeholder="Selecteer spelersprofiel" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.shirt_number ? `(#${p.shirt_number})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending || (linkUser?.role === "trainer" ? !linkTrainerId : !linkPlayerId)}
              className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white"
            >
              {linkMutation.isPending ? "Opslaan..." : "Koppeling Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Trainer Profile Dialog */}
      <Dialog open={newTrainerOpen} onOpenChange={setNewTrainerOpen}>
        <DialogContent className="max-w-sm border-[#E8E6E1] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Nieuw Trainersprofiel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#F7F5F2] border border-[#E8E6E1] overflow-hidden flex items-center justify-center text-[#888888] text-xl font-500 shrink-0">
                {newTrainerPhoto ? <img src={newTrainerPhoto} alt="" className="w-full h-full object-cover" /> : (newTrainerName?.[0] || "?")}
              </div>
              <label className="cursor-pointer flex items-center gap-2 text-sm text-[#FF6B00] border border-[#FF6B00] rounded-lg px-3 py-2">
                <Upload size={14} />
                {uploadingPhoto ? "Uploaden..." : "Foto uploaden"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Naam *</label>
              <Input placeholder="Volledige naam" value={newTrainerName} onChange={e => setNewTrainerName(e.target.value)} className="border-[#E8E6E1] bg-white" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Functietitel</label>
              <Input placeholder="bijv. Hoofdtrainer, Assistent" value={newTrainerTitle} onChange={e => setNewTrainerTitle(e.target.value)} className="border-[#E8E6E1] bg-white" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wide mb-1 block">Telefoonnummer</label>
              <Input placeholder="+31 6 ..." value={newTrainerPhone} onChange={e => setNewTrainerPhone(e.target.value)} className="border-[#E8E6E1] bg-white" />
            </div>
            <Button onClick={handleCreateTrainer} disabled={savingTrainer || !newTrainerName} className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white">
              {savingTrainer ? "Opslaan..." : "Profiel Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}