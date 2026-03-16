import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, UserCheck, Link as LinkIcon } from "lucide-react";

export default function AccountBeheer() {
  return (
    <RoleGuard allowedRoles={["trainer"]}>
      <AccountBeheerContent />
    </RoleGuard>
  );
}

function AccountBeheerContent() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("speelster");
  const [inviting, setInviting] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUser, setLinkUser] = useState(null);
  const [linkPlayerId, setLinkPlayerId] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const handleInvite = async () => {
    setInviting(true);
    // Platform only accepts "user" or "admin" — trainers get "user" role, role is stored separately
    const platformRole = inviteRole === "trainer" ? "user" : "user";
    const result = await base44.users.inviteUser(inviteEmail, platformRole);
    // Store the app-specific role on the user record
    if (result?.id) {
      await base44.entities.User.update(result.id, { role: inviteRole });
    }
    setInviting(false);
    setInviteOpen(false);
    setInviteEmail("");
    queryClient.invalidateQueries(["users"]);
  };

  const linkMutation = useMutation({
    mutationFn: () => base44.auth.updateMe ? 
      base44.entities.User.update(linkUser.id, { player_id: linkPlayerId }) : 
      base44.entities.User.update(linkUser.id, { player_id: linkPlayerId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setLinkOpen(false);
      setLinkUser(null);
      setLinkPlayerId("");
    }
  });

  const openLink = (user) => {
    setLinkUser(user);
    setLinkPlayerId(user.player_id || "");
    setLinkOpen(true);
  };

  const getLinkedPlayer = (userId) => {
    const u = users.find(u => u.id === userId);
    if (!u?.player_id) return null;
    return players.find(p => p.id === u.player_id);
  };

  const speelsters = users.filter(u => u.role === "speelster");
  const trainers = users.filter(u => u.role === "trainer");

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Accountbeheer</h1>
          <p className="text-white/70 text-sm">{speelsters.length} speelsters · {trainers.length} trainers</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)", color: "#fff" }}>
          <Plus size={16} className="mr-1" /> Uitnodigen
        </Button>
      </div>

      {/* Trainers */}
      {trainers.length > 0 && (
        <div className="elite-card p-4">
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#D45A30] mb-3">Trainers</h2>
          <div className="space-y-2">
            {trainers.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#1A1F2E] flex items-center justify-center text-white text-sm font-bold">
                  {u.full_name?.[0] || u.email?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1F2E]">{u.full_name || u.email}</p>
                  <p className="text-xs text-[#2F3650]">{u.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#1A1F2E", color: "#E8724A" }}>Trainer</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speelsters */}
      <div className="elite-card p-4">
        <h2 className="font-bold text-sm uppercase tracking-wide text-[#D45A30] mb-3">Speelsters</h2>
        {speelsters.length === 0 ? (
          <p className="text-sm text-[#2F3650]">Nog geen speelster-accounts aangemaakt.</p>
        ) : (
          <div className="space-y-2">
            {speelsters.map(u => {
              const linked = getLinkedPlayer(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#FDE8DC] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#FDE8DC] flex items-center justify-center text-[#D45A30] text-sm font-bold">
                    {u.full_name?.[0] || u.email?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1F2E] truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-[#2F3650] truncate">{u.email}</p>
                    {linked ? (
                      <p className="text-xs text-[#D45A30] flex items-center gap-1 mt-0.5">
                        <UserCheck size={10} /> Gekoppeld aan {linked.name}
                      </p>
                    ) : (
                      <p className="text-xs text-red-400 mt-0.5">Niet gekoppeld aan profiel</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openLink(u)} className="border-[#FDE8DC] text-[#D45A30] text-xs shrink-0">
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
        <DialogContent className="max-w-sm border-[#FDE8DC]" style={{ backgroundColor: "#FFF5F0", color: "#1A1F2E" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1F2E" }}>Gebruiker Uitnodigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="E-mailadres" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="border-[#FDE8DC] text-[#1A1F2E] bg-white" />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speelster">Speelster</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#2F3650]">De gebruiker ontvangt een uitnodigingsmail om een wachtwoord in te stellen.</p>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="w-full text-white" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
              {inviting ? "Uitnodigen..." : "Uitnodiging Versturen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Player Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm border-[#FDE8DC]" style={{ backgroundColor: "#FFF5F0", color: "#1A1F2E" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1F2E" }}>Koppel aan Spelersprofiel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#2F3650]">Account: <strong>{linkUser?.full_name || linkUser?.email}</strong></p>
            <Select value={linkPlayerId} onValueChange={setLinkPlayerId}>
              <SelectTrigger className="border-[#FDE8DC] text-[#1A1F2E] bg-white">
                <SelectValue placeholder="Selecteer spelersprofiel" />
              </SelectTrigger>
              <SelectContent>
                {players.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} {p.shirt_number ? `(#${p.shirt_number})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending || !linkPlayerId} className="w-full text-white" style={{ background: "linear-gradient(135deg,#D45A30,#E8724A)" }}>
              {linkMutation.isPending ? "Opslaan..." : "Koppeling Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}