import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { HelpCircle, Lightbulb, MessageSquare } from "lucide-react";

export default function EmviFeedback() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedType, setSelectedType] = useState("vraag");
  const messagesEndRef = useRef(null);

  const { data: feedbackList = [] } = useQuery({
    queryKey: ["feedback", user?.email],
    queryFn: () => base44.entities.Feedback.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (feedbackList.length > 0) {
      setMessages(feedbackList.map(f => ({
        id: f.id,
        type: "user",
        message: f.message,
        feedbackType: f.type,
        timestamp: f.created_date
      })));
    }
  }, [feedbackList]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData) => {
      return await base44.entities.Feedback.create(feedbackData);
    },
    onSuccess: (newFeedback) => {
      setMessages(prev => [...prev, {
        id: newFeedback.id,
        type: "user",
        message: inputValue,
        feedbackType: selectedType,
        timestamp: new Date().toISOString()
      }]);
      setInputValue("");
      queryClient.invalidateQueries({ queryKey: ["feedback", user?.email] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    submitFeedbackMutation.mutate({
      user_email: user.email,
      user_name: user.full_name,
      message: inputValue,
      type: selectedType
    });
  };

  const getEmviResponse = (feedbackType) => {
    const responses = {
      vraag: [
        "Goede vraag! 🤔 We bekijken dit en helpen je snel verder.",
        "Interessante vraag! 💪 De beheerder ziet dit en antwoordt je binnenkort.",
        "Top dat je dit vraagt! ⚽ We nemen dit ter harte."
      ],
      tip: [
        "Wat een geweldige tip! 🌟 We waarderen je inzicht echt.",
        "Dank je wel! 💡 Dit gaat recht naar het team.",
        "Leuk idee! 🚀 Bedankt voor je bijdrage!"
      ],
      opmerking: [
        "Begrepen! 👍 Je feedback helpt ons beter te worden.",
        "Dank je! 🎯 We zien het en nemen het mee.",
        "Top dat je dit deelt! 📝 Dit is waardevol voor ons."
      ]
    };
    return responses[feedbackType][Math.floor(Math.random() * responses[feedbackType].length)];
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "vraag": return <HelpCircle size={20} />;
      case "tip": return <Lightbulb size={20} />;
      case "opmerking": return <MessageSquare size={20} />;
      default: return null;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case "vraag": return { bg: "rgba(96,165,250,0.12)", border: "#60a5fa", text: "#60a5fa" };
      case "tip": return { bg: "rgba(139,92,255,0.12)", border: "#8b5cf6", text: "#8b5cf6" };
      case "opmerking": return { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", text: "#f59e0b" };
      default: return { bg: "#f5f5f5", border: "#e0e0e0", text: "#666" };
    }
  };

  return (
    <div className="pb-20 xl:pb-8" style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: "16px"
    }}>
      {/* Emvi Image */}
      <div style={{
        textAlign: "center",
        marginBottom: "-8px"
      }}>
        <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/91f794581_Emvi-top.png" alt="Emvi" style={{ height: "100px", objectFit: "contain" }} />
      </div>

      {/* Header Text */}
      <div style={{
        textAlign: "center"
      }}>
        <h1 className="t-page-title" style={{ color: "#1a1a1a", marginBottom: "4px" }}>
          Praat met Emvi
        </h1>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(26,26,26,0.65)" }}>
          Stel vragen, deel tips of geef feedback
        </p>
      </div>

      {/* Chat area */}
      <div style={{
        padding: "0px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minHeight: "200px",
        maxHeight: "380px",
        overflowY: "auto"
      }}>
        {/* Initial Emvi greeting */}
        {messages.length === 0 && (
          <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "12px",
            alignItems: "flex-end"
          }}>
            <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" alt="Emvi" style={{ height: "45px", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255,104,0,0.12)",
              border: "1.5px solid rgba(255,104,0,0.30)",
              borderRadius: "12px",
              padding: "12px",
              maxWidth: "85%"
            }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF6800", lineHeight: 1.4 }}>
                Hallo! Ik ben Emvi! 👋 Heb je een vraag, tip of opmerking? Ik ben hier om te helpen!
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div key={msg.id || idx}>
            {/* User message */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              justifyContent: "flex-end"
            }}>
              <div style={{
                background: "#FF6800",
                color: "#ffffff",
                borderRadius: "12px",
                padding: "12px",
                maxWidth: "85%",
                wordWrap: "break-word"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "11px", fontWeight: 700 }}>
                  {getTypeIcon(msg.feedbackType)}
                  {msg.feedbackType === "vraag" ? "Vraag" : msg.feedbackType === "tip" ? "Tip" : "Opmerking"}
                </div>
                <p style={{ fontSize: "12px", lineHeight: 1.4 }}>
                  {msg.message}
                </p>
              </div>
            </div>

            {/* Emvi response */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              alignItems: "flex-end"
            }}>
              <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" alt="Emvi" style={{ height: "40px", flexShrink: 0 }} />
              <div style={{
                background: "rgba(255,104,0,0.12)",
                border: "1.5px solid rgba(255,104,0,0.30)",
                borderRadius: "12px",
                padding: "12px",
                maxWidth: "85%"
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF6800", lineHeight: 1.4 }}>
                  {getEmviResponse(msg.feedbackType)}
                </p>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="glass" style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px"
      }}>
        {/* Type selector */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { value: "vraag", icon: HelpCircle, label: "Vraag", color: "#60a5fa" },
            { value: "tip", icon: Lightbulb, label: "Tip", color: "#8b5cf6" },
            { value: "opmerking", icon: MessageSquare, label: "Opmerking", color: "#f59e0b" }
          ].map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "2px solid " + (selectedType === option.value ? option.color : "rgba(26,26,26,0.15)"),
                  background: selectedType === option.value ? option.color + "15" : "transparent",
                  color: selectedType === option.value ? option.color : "rgba(26,26,26,0.50)",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Icon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            selectedType === "vraag" ? "Stel je vraag..." :
            selectedType === "tip" ? "Deel je tip..." :
            "Geef je opmerking..."
          }
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "2px solid rgba(26,26,26,0.15)",
            fontSize: "13px",
            fontFamily: "inherit",
            fontWeight: 500,
            minHeight: "80px",
            resize: "none",
            boxSizing: "border-box"
          }}
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!inputValue.trim() || submitFeedbackMutation.isPending}
          className="btn-primary"
          style={{
            opacity: inputValue.trim() ? 1 : 0.5,
            cursor: inputValue.trim() ? "pointer" : "not-allowed"
          }}
        >
          {submitFeedbackMutation.isPending ? "Verzenden..." : "Verzend naar Emvi"}
        </button>
      </form>
    </div>
  );
}