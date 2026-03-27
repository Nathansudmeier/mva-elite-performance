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
  const [pressedMessageId, setPressedMessageId] = useState(null);

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
    onSuccess: () => queryClient.invalidateQueries(["chatMessages", chatId]),
  });

  const updateReadTimeMutation = useMutation({
    mutationFn: async () => {
      const member = await base44.entities.ChatMember.filter({ chat_id: chatId, user_email: user.email });
      if (member.length > 0) {
        return base44.entities.ChatMember.update(member[0].id, { last_read_time: new Date().toISOString() });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(["chatMembers", user?.email]),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    updateReadTimeMutation.mutate();
  }, [chatId]);

  const handleSend = () => {
    if (messageText.trim() || photoFile) sendMessageMutation.mutate();
  };

  const canDelete = (senderEmail) => isTrainer || senderEmail === user.email;
  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const formatTime = (date) => new Date(date).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  const isOwn = (msg) => msg.sender_email === user.email;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100dvh - 60px - 90px)",  /* 60px topbar, 90px tabbar */
      margin: "-1rem -1rem 0",               /* stap uit Layout padding */
      background: "#FFF3E8",
    }}>
      {/* Back button + titel — valt binnen de Layout flow */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        marginBottom: "8px",
        maxWidth: "720px", margin: "0 auto 8px",
      }}>
        <button
          onClick={() => navigate("/Messages")}
          style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "#ffffff", border: "2.5px solid #1a1a1a",
            boxShadow: "2px 2px 0 #1a1a1a",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="#1a1a1a" />
        </button>
        <h1 className="t-page-title" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {chat?.name || "Chat"}
        </h1>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: "0 0 16px 0",
        display: "flex", flexDirection: "column", gap: "6px",
      }}>
        <div style={{ maxWidth: "720px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {sortedMessages.map((message, i) => {
            const own = isOwn(message);
            const prevMsg = sortedMessages[i - 1];
            const showAvatar = !own && (!prevMsg || prevMsg.sender_email !== message.sender_email);

            return (
              <div
                key={message.id}
                style={{ display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start", gap: "2px" }}
              >
                {/* Sender name for others */}
                {!own && showAvatar && (
                  <p style={{ fontSize: "11px", fontWeight: 800, color: "rgba(26,26,26,0.45)", marginLeft: "12px", marginBottom: "2px" }}>
                    {message.sender_name}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexDirection: own ? "row-reverse" : "row" }}>
                  {/* Avatar */}
                  {!own && (
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%",
                      background: "#FF6800", border: "2px solid #1a1a1a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 900, color: "#ffffff", flexShrink: 0,
                      opacity: showAvatar ? 1 : 0,
                    }}>
                      {message.sender_name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    onTouchStart={() => canDelete(message.sender_email) && setPressedMessageId(message.id)}
                    onTouchEnd={() => setPressedMessageId(null)}
                    onMouseEnter={() => setPressedMessageId(message.id)}
                    onMouseLeave={() => setPressedMessageId(null)}
                    style={{ position: "relative", maxWidth: "calc(100vw - 100px)" }}
                  >
                    <div style={{
                      background: own ? "#FF6800" : "#ffffff",
                      border: "2.5px solid #1a1a1a",
                      borderRadius: own ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      boxShadow: "2px 2px 0 #1a1a1a",
                      padding: "10px 14px",
                      color: own ? "#ffffff" : "#1a1a1a",
                      wordBreak: "break-word",
                      fontSize: "14px",
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}>
                      {message.text}
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="attachment"
                          style={{
                            marginTop: "8px", borderRadius: "12px",
                            maxWidth: "220px", width: "100%",
                            border: "1.5px solid " + (own ? "rgba(255,255,255,0.3)" : "#1a1a1a"),
                            display: "block",
                          }}
                        />
                      )}
                    </div>

                    {/* Delete button on hover/press */}
                    {pressedMessageId === message.id && canDelete(message.sender_email) && (
                      <button
                        onClick={() => deleteMessageMutation.mutate(message.id)}
                        style={{
                          position: "absolute", top: "-10px", right: own ? "auto" : "-10px", left: own ? "-10px" : "auto",
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: "#FF3DA8", border: "2px solid #1a1a1a",
                          boxShadow: "1px 1px 0 #1a1a1a",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", zIndex: 5,
                        }}
                      >
                        <Trash2 size={12} color="#ffffff" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <p style={{
                  fontSize: "10px", fontWeight: 600,
                  color: "rgba(26,26,26,0.35)",
                  marginLeft: own ? 0 : "46px",
                  marginRight: own ? "4px" : 0,
                  textAlign: own ? "right" : "left",
                }}>
                  {formatTime(message.created_date)}
                </p>
              </div>
            );
          })}

          {sortedMessages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: "32px", marginBottom: "8px" }}>💬</p>
              <p className="t-section-title">Nog geen berichten</p>
              <p className="t-secondary" style={{ marginTop: "4px" }}>Stuur het eerste bericht!</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div style={{
        background: "#FFF3E8",
        borderTop: "2.5px solid #1a1a1a",
        padding: "10px 16px",
        paddingBottom: "10px",
        flexShrink: 0,
        position: "sticky",
        bottom: 0,
      }}>
        {/* Photo preview */}
        {photoFile && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#ffffff", border: "2px solid #1a1a1a",
            borderRadius: "12px", padding: "8px 12px", marginBottom: "8px",
            boxShadow: "2px 2px 0 #1a1a1a",
          }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>📸 {photoFile.name}</span>
            <button onClick={() => setPhotoFile(null)} style={{ background: "transparent", border: "none", color: "#FF3DA8", cursor: "pointer", fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>✕</button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "720px", margin: "0 auto" }}>
          {/* Image attach */}
          <label style={{
            width: "44px", height: "44px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#ffffff", border: "2.5px solid #1a1a1a",
            borderRadius: "12px", boxShadow: "2px 2px 0 #1a1a1a",
            cursor: "pointer",
          }}>
            <Image size={18} color="rgba(26,26,26,0.55)" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0])} />
          </label>

          {/* Text input */}
          <textarea
            ref={textInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
            placeholder="Stuur een bericht..."
            rows={1}
            style={{
              flex: 1,
              background: "#ffffff",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              padding: "10px 14px",
              color: "#1a1a1a",
              fontSize: "15px",
              fontWeight: 500,
              maxHeight: "100px",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              lineHeight: 1.4,
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!messageText.trim() && !photoFile) || sendMessageMutation.isPending}
            style={{
              width: "44px", height: "44px", flexShrink: 0,
              borderRadius: "12px",
              background: (messageText.trim() || photoFile) ? "#FF6800" : "#ffffff",
              border: "2.5px solid #1a1a1a",
              boxShadow: "2px 2px 0 #1a1a1a",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: (messageText.trim() || photoFile) && !sendMessageMutation.isPending ? "pointer" : "not-allowed",
              opacity: (messageText.trim() || photoFile) && !sendMessageMutation.isPending ? 1 : 0.45,
              transition: "background 0.15s",
            }}
          >
            <Send size={17} color={(messageText.trim() || photoFile) ? "#ffffff" : "#1a1a1a"} />
          </button>
        </div>
      </div>
    </div>
  );
}