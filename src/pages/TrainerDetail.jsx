import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ArrowLeft, Phone, Mail, User, Send, MessageCircle, Edit2, Check, X, Upload, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { resizeImage } from "@/components/utils/imageResize";

export default function TrainerDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const trainerId = urlParams.get("id");
  const queryClient = useQueryClient();
  const { user, isTrainer } = useCurrentUser();

  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);

  const { data: trainer } = useQuery({
    queryKey: ["trainer", trainerId],
    queryFn: () => base44.entities.Trainer.filter({ id: trainerId }).then(r => r[0]),
    enabled: !!trainerId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", trainerId],
    queryFn: () => base44.entities.Message.filter({ trainer_id: trainerId }),
    enabled: !!trainerId,
  });

  const sendMutation = useMutation({
    mutationFn: (text) => base44.entities.Message.create({
      trainer_id: trainerId,
      sender_name: user?.full_name || user?.email || "Speler",
      sender_email: user?.email || "",
      text,
      is_reply: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", trainerId] });
      setNewMessage("");
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ text, replyToId }) => base44.entities.Message.create({
      trainer_id: trainerId,
      sender_name: user?.full_name || "Trainer",
      sender_email: user?.email || "",
      text,
      is_reply: true,
      reply_to_id: replyToId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", trainerId] });
      setReplyText("");
      setReplyingTo(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      let photo_url = data.photo_url || "";
      if (photoFile) {
        const resized = await resizeImage(photoFile);
        const res = await base44.integrations.Core.UploadFile({ file: resized });
        photo_url = res.file_url;
      }
      return base44.entities.Trainer.update(trainerId, { ...data, photo_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainer", trainerId] });
      setEditing(false);
      setPhotoFile(null);
    },
  });

  const openEdit = () => {
    setEditForm({
      name: trainer.name || "",
      role_title: trainer.role_title || "",
      phone: trainer.phone || "",
      email: trainer.email || "",
      photo_url: trainer.photo_url || "",
    });
    setPhotoFile(null);
    setEditing(true);
  };

  // Group: top-level messages + their replies
  const topMessages = messages
    .filter(m => !m.is_reply)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const getReplies = (msgId) =>
    messages
      .filter(m => m.is_reply && m.reply_to_id === msgId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (!trainer) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link to={createPageUrl("Staff")} className="inline-flex items-center gap-2 t-secondary hover:opacity-70 transition-opacity">
        <ArrowLeft size={16} /> Terug naar Staff
      </Link>

      {/* Trainer Card */}
      <div className="glass p-6">
        {editing ? (
          <div className="space-y-4">
            {/* Photo upload in edit mode */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
                {(photoFile ? URL.createObjectURL(photoFile) : editForm.photo_url) ? (
                  <img src={photoFile ? URL.createObjectURL(photoFile) : editForm.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} style={{ color: "#FF8C3A" }} />
                )}
              </div>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer" style={{ border: "1px dashed rgba(255,107,0,0.5)", background: "rgba(255,107,0,0.08)" }}>
                <Upload size={14} style={{ color: "#FF8C3A" }} />
                <span className="t-secondary text-sm">{photoFile ? photoFile.name : "Foto uploaden"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
              </label>
            </div>
            <Input placeholder="Naam *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="Functietitel (bijv. Hoofdtrainer, Assistent)" value={editForm.role_title} onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="Telefoonnummer" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <Input placeholder="E-mailadres" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px" }} />
            <div className="flex gap-3">
              <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending || !editForm.name} className="btn-primary">
                {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
              </button>
              <button onClick={() => { setEditing(false); setPhotoFile(null); }} className="btn-secondary">
                Annuleer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.10)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
              {trainer.photo_url ? (
                <img src={trainer.photo_url} alt={trainer.name} className="w-full h-full object-cover" />
              ) : (
                <User size={32} style={{ color: "#FF8C3A" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="t-page-title">{trainer.name}</h1>
              {trainer.role_title && <p className="t-secondary-sm mt-0.5" style={{ color: "#FF8C3A" }}>{trainer.role_title}</p>}
              {trainer.phone && (
                <a href={`tel:${trainer.phone}`} className="inline-flex items-center gap-1.5 t-secondary mt-2 hover:opacity-70 transition-opacity">
                  <Phone size={14} /> {trainer.phone}
                </a>
              )}
              {trainer.email && (
                <a href={`mailto:${trainer.email}`} className="inline-flex items-center gap-1.5 t-secondary mt-1 hover:opacity-70 transition-opacity">
                  <Mail size={14} /> {trainer.email}
                </a>
              )}
            </div>
            {isTrainer && (
              <button onClick={openEdit} className="btn-secondary self-start" style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}>
                <Edit2 size={12} /> Bewerken
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} style={{ color: "#FF8C3A" }} />
          <h2 className="t-section-title">Berichten</h2>
          {messages.length > 0 && (
            <span className="ml-auto t-tertiary">{topMessages.length} bericht{topMessages.length !== 1 ? "en" : ""}</span>
          )}
        </div>

        {/* Send new message (players only) */}
        {!isTrainer && (
          <div className="space-y-2">
            <Textarea
              placeholder={`Stuur een bericht naar ${trainer.name}…`}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              rows={3}
              style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", resize: "none" }}
            />
            <button onClick={() => sendMutation.mutate(newMessage)} disabled={sendMutation.isPending || !newMessage.trim()} className="btn-secondary">
              <Send size={14} />
              {sendMutation.isPending ? "Versturen..." : "Verstuur bericht"}
            </button>
          </div>
        )}

        {/* Message list */}
        {topMessages.length === 0 ? (
          <p className="t-tertiary text-center py-4">Nog geen berichten.</p>
        ) : (
          <div className="space-y-4">
            {topMessages.map(msg => {
              const replies = getReplies(msg.id);
              return (
                <div key={msg.id} className="rounded-xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.10)" }}>
                  {/* Original message */}
                  <div className="p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="t-card-title">{msg.sender_name || "Speler"}</span>
                      <span className="t-tertiary">
                        {msg.created_date ? format(new Date(msg.created_date), "d MMM HH:mm", { locale: nl }) : ""}
                      </span>
                    </div>
                    <p className="t-secondary leading-relaxed">{msg.text}</p>

                    {isTrainer && replyingTo !== msg.id && (
                      <button onClick={() => setReplyingTo(msg.id)} className="mt-2 text-xs" style={{ color: "#FF8C3A" }}>
                        Beantwoorden
                      </button>
                    )}

                    {isTrainer && replyingTo === msg.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Schrijf een antwoord…"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={2}
                          style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", resize: "none" }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => replyMutation.mutate({ text: replyText, replyToId: msg.id })} disabled={replyMutation.isPending || !replyText.trim()} className="btn-secondary" style={{ height: "34px", fontSize: "12px", padding: "0 12px" }}>
                            <Send size={12} /> {replyMutation.isPending ? "..." : "Verstuur"}
                          </button>
                          <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="btn-secondary" style={{ height: "34px", fontSize: "12px", padding: "0 12px", background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                            Annuleer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  {replies.map(reply => (
                    <div key={reply.id} className="px-4 py-3" style={{ background: "rgba(255,107,0,0.10)", borderTop: "0.5px solid rgba(255,107,0,0.2)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: "#FF8C3A" }}>↩ {reply.sender_name || "Trainer"}</span>
                        <span className="t-tertiary">
                          {reply.created_date ? format(new Date(reply.created_date), "d MMM HH:mm", { locale: nl }) : ""}
                        </span>
                      </div>
                      <p className="t-secondary leading-relaxed">{reply.text}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}