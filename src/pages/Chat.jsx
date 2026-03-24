import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { Send, Image, ArrowLeft, Trash2 } from "lucide-react";

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
  const formatTime = (date) => new Date(date).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#FFF3E8" }}>
      {/* Header */}
      <div style={{ background: "#ffffff", borderBottom: "2.5px solid #1a1a1a", padding: "12px 16px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "720px", margin: "0 auto" }}>
          <button onClick={() => navigate("/Messages")} style={{ width: "40px", height: "40px", borderRadius: "10px", background: "transparent", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="#1a1a1a" />
          </button>
          <h1 className="t-page-title" style={{ flex: 1, margin: 0 }}>{chat?.name}</h1>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", maxWidth: "720px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {sortedMessages.map((message) => (
          <div
            key={message.id}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
            style={{ display: "flex", gap: "8px", justifyContent: message.sender_email === user.email ? "flex-end" : "flex-start" }}
          >
            {message.sender_email !== user.email && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FF6800", border: "1.5px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>
                  {message.sender_name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: "10px", color: "rgba(26,26,26,0.40)", fontWeight: 700 }}>{message.sender_name}</span>
              </div>
            )}

            <div style={{ maxWidth: "280px", display: "flex", flexDirection: "column", gap: "4px", flex: message.sender_email !== user.email ? "0 0 auto" : "0 1 auto" }}>
              {message.sender_email !== user.email && (
                <p style={{ fontSize: "11px", color: "rgba(26,26,26,0.40)", fontWeight: 700, marginBottom: "2px" }}>{message.sender_name}</p>
              )}

              <div
                style={{
                  position: "relative",
                  background: message.sender_email === user.email ? "#FF6800" : "#ffffff",
                  border: "2px solid #1a1a1a",
                  borderRadius: message.sender_email === user.email ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  boxShadow: "2px 2px 0 #1a1a1a",
                  padding: "10px 13px",
                  color: message.sender_email === user.email ? "#ffffff" : "#1a1a1a",
                  wordBreak: "break-word",
                  fontSize: "14px",
                  lineHeight: 1.4,
                }}
                onMouseEnter={() => setHoveredMessageId(message.id)}
              >
                {message.text}
                {message.image_url && (
                  <img src={message.image_url} alt="attachment" style={{ marginTop: "8px", borderRadius: "10px", maxWidth: "100%", border: "1.5px solid " + (message.sender_email === user.email ? "rgba(255,255,255,0.3)" : "#1a1a1a") }} />
                )}

                {hoveredMessageId === message.id && canDelete(message.sender_email) && (
                  <button
                    onClick={() => handleDeleteMessage(message.id, message.sender_email)}
                    style={{
                      position: "absolute",
                      top: "-12px",
                      right: "-12px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#FF3DA8",
                      border: "1.5px solid #1a1a1a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "1px 1px 0 #1a1a1a",
                    }}
                  >
                    <Trash2 size={13} color="#ffffff" />
                  </button>
                )}
              </div>

              <p style={{ fontSize: "10px", color: "rgba(26,26,26,0.35)", fontWeight: 600, textAlign: message.sender_email === user.email ? "right" : "left" }}>{formatTime(message.created_date)}</p>
            </div>

            {message.sender_email === user.email && (
              <div style={{ width: "32px", flexShrink: 0 }} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#FFF3E8",
          borderTop: "2.5px solid #1a1a1a",
          padding: "12px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {photoFile && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1.5px solid rgba(26,26,26,0.15)", borderRadius: "10px", padding: "8px 12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>📸 {photoFile.name}</span>
            <button onClick={() => setPhotoFile(null)} style={{ background: "transparent", border: "none", color: "#FF3DA8", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "720px", margin: "0 auto", width: "100%" }}>
          <label style={{ cursor: "pointer", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Image size={18} color="rgba(26,26,26,0.40)" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0])} />
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
            style={{
              flex: 1,
              background: "#ffffff",
              border: "2px solid #1a1a1a",
              borderRadius: "14px",
              padding: "9px 12px",
              color: "#1a1a1a",
              fontSize: "14px",
              fontWeight: 500,
              maxHeight: "100px",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />

          <button
            onClick={handleSend}
            disabled={!messageText.trim() && !photoFile || sendMessageMutation.isPending}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: messageText.trim() || photoFile ? "#FF6800" : "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "2px 2px 0 #1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (messageText.trim() || photoFile) && !sendMessageMutation.isPending ? "pointer" : "not-allowed",
              opacity: (messageText.trim() || photoFile) && !sendMessageMutation.isPending ? 1 : 0.45,
              flexShrink: 0,
            }}
          >
            <Send size={16} color={messageText.trim() || photoFile ? "#ffffff" : "#1a1a1a"} />
          </button>
        </div>
      </div>
    </div>
  );
}