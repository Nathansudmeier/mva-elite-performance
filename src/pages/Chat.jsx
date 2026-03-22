import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import { Send, Image, ArrowLeft } from "lucide-react";

export default function Chat() {
  const { user, isTrainer } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const chatId = params.get("id");

  const [messageText, setMessageText] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const { data: chat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => base44.entities.Chat.filter({ id: chatId }),
    enabled: !!chatId,
    select: d => d[0],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages", chatId],
    queryFn: () => base44.entities.ChatMessage.filter({ chat_id: chatId, is_deleted: false }),
    enabled: !!chatId,
    refetchInterval: 2000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = null;
      if (photoFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: photoFile });
        imageUrl = uploadRes.file_url;
      }

      return base44.entities.ChatMessage.create({
        chat_id: chatId,
        sender_email: user.email,
        sender_name: user.full_name.split(" ")[0],
        sender_photo_url: user?.photo_url || "",
        text: messageText,
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      setMessageText("");
      setPhotoFile(null);
      queryClient.invalidateQueries(["chatMessages", chatId]);
      queryClient.invalidateQueries(["allChats"]);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => base44.entities.ChatMessage.update(messageId, { is_deleted: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(["chatMessages", chatId]);
    },
  });

  const updateReadTimeMutation = useMutation({
    mutationFn: async () => {
      const member = await base44.entities.ChatMember.filter({
        chat_id: chatId,
        user_email: user.email,
      });
      if (member.length > 0) {
        return base44.entities.ChatMember.update(member[0].id, {
          last_read_time: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["chatMembers", user?.email]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    updateReadTimeMutation.mutate();
  }, [chatId]);

  const handleSend = () => {
    if (messageText.trim() || photoFile) {
      sendMessageMutation.mutate();
    }
  };

  const handleDeleteMessage = (messageId, senderEmail) => {
    if (isTrainer || senderEmail === user.email) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const canDelete = (senderEmail) => isTrainer || senderEmail === user.email;

  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen relative" style={{ zIndex: 2 }}>
      <DashboardBackground />

      {/* Header */}
      <div className="glass p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate("/Messages")} className="p-2 rounded-lg transition-opacity hover:opacity-80">
            <ArrowLeft size={20} style={{ color: "#FF8C3A" }} />
          </button>
          <h1 className="t-page-title flex-1">{chat?.name}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
        {sortedMessages.map((message) => (
          <div
            key={message.id}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
            className="flex gap-2"
            style={{ justifyContent: message.sender_email === user.email ? "flex-end" : "flex-start" }}
          >
            {message.sender_email !== user.email && (
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-10px"
                  style={{ background: "rgba(255,107,0,0.2)" }}
                >
                  {message.sender_name?.[0]?.toUpperCase()}
                </div>
                <span className="t-tertiary-sm">{message.sender_name}</span>
              </div>
            )}

            <div
              className="max-w-xs lg:max-w-md"
              style={{ flex: message.sender_email !== user.email ? "0 0 auto" : "0 1 auto" }}
            >
              {message.sender_email !== user.email && (
                <p className="t-tertiary-sm mb-1">{message.sender_name}</p>
              )}

              <div
                className="p-3 rounded-2xl relative group"
                style={{
                  background: message.sender_email === user.email ? "#FF6B00" : "rgba(255,255,255,0.10)",
                  border: message.sender_email === user.email ? "none" : "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius: message.sender_email === user.email ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  color: "white",
                  wordBreak: "break-word",
                }}
              >
                {message.text}
                {message.image_url && (
                  <img src={message.image_url} alt="attachment" className="mt-2 rounded-lg max-w-xs" />
                )}

                {hoveredMessageId === message.id && canDelete(message.sender_email) && (
                  <button
                    onClick={() => handleDeleteMessage(message.id, message.sender_email)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-10px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(248,113,113,0.80)" }}
                  >
                    ×
                  </button>
                )}
              </div>

              <p className="t-tertiary-sm mt-1 text-right">{formatTime(message.created_date)}</p>
            </div>

            {message.sender_email === user.email && (
              <div className="w-7 flex-shrink-0" />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        className="sticky bottom-0 left-0 right-0 p-4"
        style={{
          background: "rgba(20,10,2,0.90)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderTop: "0.5px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <label className="cursor-pointer p-2 rounded-lg transition-opacity hover:opacity-80">
            <Image size={20} style={{ color: "rgba(255,255,255,0.55)" }} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0])}
            />
          </label>

          <textarea
            ref={textInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Stuur een bericht..."
            rows={1}
            className="flex-1 resize-none"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "10px 16px",
              color: "white",
              fontSize: "14px",
              maxHeight: "100px",
              fontFamily: "inherit",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />

          <button
            onClick={handleSend}
            disabled={!messageText.trim() && !photoFile || sendMessageMutation.isPending}
            className="p-3 rounded-full transition-opacity flex-shrink-0"
            style={{
              background: messageText.trim() || photoFile ? "#FF6B00" : "rgba(255,107,0,0.3)",
              opacity: messageText.trim() || photoFile ? 1 : 0.5,
            }}
          >
            <Send size={16} style={{ color: "white" }} />
          </button>
        </div>
      </div>
    </div>
  );
}