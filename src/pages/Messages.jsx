import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import { MessageCircle, Plus } from "lucide-react";

export default function Messages() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);

  const { data: chatMembers = [] } = useQuery({
    queryKey: ["chatMembers", user?.email],
    queryFn: () => base44.entities.ChatMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allChats = [] } = useQuery({
    queryKey: ["allChats"],
    queryFn: () => base44.entities.Chat.list("-last_message_time"),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ["allMessages"],
    queryFn: () => base44.entities.ChatMessage.filter({ is_deleted: false }),
  });

  useEffect(() => {
    if (chatMembers.length > 0 && allChats.length > 0) {
      const chatIds = new Set(chatMembers.map(m => m.chat_id));
      const userChats = allChats.filter(c => chatIds.has(c.id));

      const chatsWithInfo = userChats.map(chat => {
        const lastMessage = allMessages
          .filter(m => m.chat_id === chat.id)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

        const chatMemberRecord = chatMembers.find(m => m.chat_id === chat.id);
        const hasUnread = lastMessage && chatMemberRecord && 
          new Date(lastMessage.created_date) > new Date(chatMemberRecord.last_read_time || 0);

        return {
          ...chat,
          lastMessage,
          hasUnread
        };
      });

      setChats(chatsWithInfo);
    }
  }, [chatMembers, allChats, allMessages]);

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Nu";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}u`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString("nl-NL", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4 pb-24 relative" style={{ zIndex: 2 }}>
      <DashboardBackground />

      <div className="max-w-2xl mx-auto px-4">
        <h1 className="t-page-title mb-6">Berichten</h1>

        {chats.length === 0 ? (
          <div className="glass p-8 text-center">
            <MessageCircle size={32} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="t-tertiary">Geen chats beschikbaar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/Chat?id=${chat.id}`)}
                className="glass w-full p-4 flex items-center gap-3 text-left transition-opacity hover:opacity-80"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="t-card-title truncate">{chat.name}</h3>
                    {chat.hasUnread && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#FF6B00", flexShrink: 0 }} />
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="t-secondary-sm truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {chat.lastMessage.text}
                    </p>
                  )}
                </div>
                {chat.lastMessage && (
                  <span className="t-tertiary-sm flex-shrink-0">
                    {formatTime(chat.lastMessage.created_date)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}