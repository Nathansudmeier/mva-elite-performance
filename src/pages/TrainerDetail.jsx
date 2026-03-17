import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ArrowLeft, Phone, User, Send, MessageCircle, Edit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function TrainerDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const trainerId = urlParams.get("id");
  const queryClient = useQueryClient();
  const { user, isTrainer } = useCurrentUser();

  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

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
      <Link to={createPageUrl("Staff")} className="inline-flex items-center gap-2 text-sm text-[#888888] hover:text-[#FF6B00] transition-colors">
        <ArrowLeft size={16} /> Terug naar Staff
      </Link>

      {/* Trainer Card */}
      <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F7F5F2] flex items-center justify-center flex-shrink-0">
            {trainer.photo_url ? (
              <img src={trainer.photo_url} alt={trainer.name} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-[#FF6B00]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-500 text-[#1A1A1A]">{trainer.name}</h1>
            {trainer.role_title && (
              <p className="text-sm text-[#FF6B00] mt-0.5">{trainer.role_title}</p>
            )}
            {trainer.phone && (
              <a href={`tel:${trainer.phone}`} className="inline-flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#FF6B00] mt-2 transition-colors">
                <Phone size={14} /> {trainer.phone}
              </a>
            )}
          </div>
          {isTrainer && (
            <Link
              to={createPageUrl("Staff")}
              className="flex items-center gap-1 text-xs text-[#888888] border border-[#E8E6E1] rounded-lg px-3 py-1.5 hover:bg-[#FFF3EB] hover:text-[#FF6B00] transition-colors self-start"
            >
              <Edit2 size={12} /> Bewerken
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-[#FF6B00]" />
          <h2 className="font-500 text-[#1A1A1A]">Berichten</h2>
          {messages.length > 0 && (
            <span className="ml-auto text-xs text-[#888888]">{topMessages.length} bericht{topMessages.length !== 1 ? "en" : ""}</span>
          )}
        </div>

        {/* Send new message (players only) */}
        {!isTrainer && (
          <div className="space-y-2">
            <Textarea
              placeholder={`Stuur een bericht naar ${trainer.name}…`}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="border-[#E8E6E1] bg-white text-[#1A1A1A] resize-none text-sm"
              rows={3}
            />
            <Button
              onClick={() => sendMutation.mutate(newMessage)}
              disabled={sendMutation.isPending || !newMessage.trim()}
              className="bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm"
            >
              <Send size={14} className="mr-1.5" />
              {sendMutation.isPending ? "Versturen..." : "Verstuur bericht"}
            </Button>
          </div>
        )}

        {/* Message list */}
        {topMessages.length === 0 ? (
          <p className="text-sm text-[#AAAAAA] text-center py-4">Nog geen berichten.</p>
        ) : (
          <div className="space-y-4">
            {topMessages.map(msg => {
              const replies = getReplies(msg.id);
              return (
                <div key={msg.id} className="border border-[#E8E6E1] rounded-xl overflow-hidden">
                  {/* Original message */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-500 text-[#1A1A1A]">{msg.sender_name || "Speler"}</span>
                      <span className="text-[11px] text-[#AAAAAA]">
                        {msg.created_date ? format(new Date(msg.created_date), "d MMM HH:mm", { locale: nl }) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-[#444444] leading-relaxed">{msg.text}</p>

                    {/* Reply button for trainers */}
                    {isTrainer && replyingTo !== msg.id && (
                      <button
                        onClick={() => setReplyingTo(msg.id)}
                        className="mt-2 text-xs text-[#FF6B00] hover:underline"
                      >
                        Beantwoorden
                      </button>
                    )}

                    {/* Reply input */}
                    {isTrainer && replyingTo === msg.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Schrijf een antwoord…"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          className="border-[#E8E6E1] bg-[#F7F5F2] text-[#1A1A1A] resize-none text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => replyMutation.mutate({ text: replyText, replyToId: msg.id })}
                            disabled={replyMutation.isPending || !replyText.trim()}
                            size="sm"
                            className="bg-[#FF6B00] hover:bg-[#E55A00] text-white text-xs"
                          >
                            <Send size={12} className="mr-1" />
                            {replyMutation.isPending ? "..." : "Verstuur"}
                          </Button>
                          <Button
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            size="sm"
                            variant="outline"
                            className="text-xs border-[#E8E6E1]"
                          >
                            Annuleer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  {replies.map(reply => (
                    <div key={reply.id} className="bg-[#FFF3EB] border-t border-[#E8E6E1] px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-500 text-[#FF6B00]">↩ {reply.sender_name || "Trainer"}</span>
                        <span className="text-[11px] text-[#AAAAAA]">
                          {reply.created_date ? format(new Date(reply.created_date), "d MMM HH:mm", { locale: nl }) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-[#444444] leading-relaxed">{reply.text}</p>
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