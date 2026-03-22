import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import DashboardBackground from "../components/dashboard/DashboardBackground";
import { MessageCircle, Plus, Trash2 } from "lucide-react";

export default function Messages() {
  const { user, isTrainer } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chats, setChats] = useState([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatToDelete, setChatToDelete] = useState(null);

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

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const initializeChatsM = useMutation({
    mutationFn: () => base44.functions.invoke('initializeChats', {}),
    onSuccess: () => {
      queryClient.invalidateQueries(["chatMembers", user?.email]);
      queryClient.invalidateQueries(["allChats"]);
    },
  });

  const createDirectChatM = useMutation({
    mutationFn: async () => {
      const chat = await base44.entities.Chat.create({
        name: selectedUsers.map(e => allUsers.find(u => u.email === e)?.full_name).join(", "),
        is_group: false,
      });
      const members = [user.email, ...selectedUsers];
      for (const email of members) {
        await base44.entities.ChatMember.create({
          chat_id: chat.id,
          user_email: email,
        });
      }
      return chat;
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries(["chatMembers", user?.email]);
      queryClient.invalidateQueries(["allChats"]);
      setShowUserPicker(false);
      setSelectedUsers([]);
      navigate(`/Chat?id=${chat.id}`);
    },
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

  useEffect(() => {
    if (user?.email && isTrainer) {
      initializeChatsM.mutate();
    }
  }, [user?.email]);

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="t-page-title">Berichten</h1>
          <button
            onClick={() => setShowUserPicker(true)}
            className="p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,107,0,0.20)", border: "0.5px solid rgba(255,107,0,0.35)" }}
          >
            <Plus size={20} style={{ color: "#FF8C3A" }} />
          </button>
        </div>

        {isTrainer && chats.length === 0 && (
          <button
            onClick={() => initializeChatsM.mutate()}
            disabled={initializeChatsM.isPending}
            className="glass w-full p-4 text-center mb-4 transition-opacity hover:opacity-80"
          >
            <p className="t-secondary">Maak MVA Noord groepschat aan</p>
          </button>
        )}

        {showUserPicker && (
          <div className="glass p-4 mb-4 space-y-3">
            <h3 className="t-card-title">Selecteer contactpersonen</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allUsers
                .filter(u => u.email !== user.email)
                .map(u => (
                  <label key={u.email} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.email)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, u.email]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(e => e !== u.email));
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="t-secondary">{u.full_name}</span>
                  </label>
                ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowUserPicker(false);
                  setSelectedUsers([]);
                }}
                className="flex-1 p-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <span className="t-secondary">Annuleer</span>
              </button>
              <button
                onClick={() => createDirectChatM.mutate()}
                disabled={selectedUsers.length === 0 || createDirectChatM.isPending}
                className="flex-1 p-2 rounded-lg transition-opacity"
                style={{
                  background: selectedUsers.length > 0 ? "#FF6B00" : "rgba(255,107,0,0.3)",
                  opacity: selectedUsers.length > 0 ? 1 : 0.5,
                }}
              >
                <span className="t-secondary" style={{ color: "white" }}>Start chat</span>
              </button>
            </div>
          </div>
        )}

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