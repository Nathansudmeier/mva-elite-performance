import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { HelpCircle, Lightbulb, MessageSquare, Send } from "lucide-react";

export default function EmviFeedback() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedType, setSelectedType] = useState("vraag");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

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
      case "vraag": return <HelpCircle size={16} />;
      case "tip": return <Lightbulb size={16} />;
      case "opmerking": return <MessageSquare size={16} />;
      default: return null;
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 120px)", /* subtract top nav + bottom nav */
        overflow: "hidden",
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Top: Emvi character + header — compact when there are messages */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: hasMessages ? "12px 16px 0" : "20px 16px 0" }}>
        <img
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/91f794581_Emvi-top.png"
          alt="Emvi"
          style={{ height: hasMessages ? "72px" : "120px", objectFit: "contain", transition: "height 0.3s ease" }}
        />
        <div
          className="glass"
          style={{
            background: "#FF6800",
            width: "100%",
            borderRadius: "14px",
            marginTop: "10px",
            padding: hasMessages ? "10px 16px" : "16px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: hasMessages ? "16px" : "20px", fontWeight: 900, color: "white", margin: 0 }}>
            Praat met Emvi
          </h1>
          {!hasMessages && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: "4px 0 0" }}>
              Stel vragen, deel tips of geef feedback
            </p>
          )}
        </div>
      </div>

      {/* Chat Area — scrollable middle */}
      <div
        ref={chatContainerRef}
        style={{
          flex: hasMessages ? 1 : 0,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {!hasMessages && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "rgba(26,26,26,0.35)", textAlign: "center", padding: "10px" }}>
            <MessageSquare size={28} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Nog geen berichten</p>
            <p style={{ fontSize: "12px", margin: 0 }}>Stuur hieronder je eerste vraag, tip of opmerking.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id || idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* User message */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "#FF6800", borderRadius: "14px", padding: "10px 14px", maxWidth: "75%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.80)" }}>
                  {getTypeIcon(msg.feedbackType)}
                  {msg.feedbackType === "vraag" ? "Vraag" : msg.feedbackType === "tip" ? "Tip" : "Opmerking"}
                </div>
                <p style={{ fontSize: "13px", lineHeight: 1.45, color: "white", margin: 0 }}>{msg.message}</p>
              </div>
            </div>

            {/* Emvi response */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <img
                src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png"
                alt="Emvi"
                style={{ height: "36px", flexShrink: 0 }}
              />
              <div style={{ background: "rgba(255,104,0,0.10)", border: "1.5px solid rgba(255,104,0,0.25)", borderRadius: "14px", padding: "10px 14px", maxWidth: "75%" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF6800", lineHeight: 1.45, margin: 0 }}>
                  {getEmviResponse(msg.feedbackType)}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form — always at bottom, never cut off */}
      <form
        onSubmit={handleSubmit}
        className="glass"
        style={{ flexShrink: 0, margin: "0 16px 16px", borderRadius: "16px" }}
      >
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Type Selector */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { value: "vraag", icon: HelpCircle, label: "Vraag" },
              { value: "tip", icon: Lightbulb, label: "Tip" },
              { value: "opmerking", icon: MessageSquare, label: "Opmerking" }
            ].map(option => {
              const Icon = option.icon;
              const isSelected = selectedType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 12px", borderRadius: "20px", fontWeight: 700,
                    fontSize: "12px", cursor: "pointer", transition: "all 0.15s",
                    border: "2px solid",
                    borderColor: isSelected ? "#FF6800" : "rgba(26,26,26,0.15)",
                    background: isSelected ? "rgba(255,104,0,0.10)" : "transparent",
                    color: isSelected ? "#FF6800" : "rgba(26,26,26,0.45)"
                  }}
                >
                  <Icon size={13} />
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
              width: "100%", borderRadius: "10px", border: "2px solid rgba(26,26,26,0.12)",
              padding: "10px 12px", resize: "none", outline: "none",
              fontSize: "13px", fontFamily: "inherit", minHeight: "72px",
              background: "white", boxSizing: "border-box"
            }}
            onFocus={e => e.target.style.borderColor = "#FF6800"}
            onBlur={e => e.target.style.borderColor = "rgba(26,26,26,0.12)"}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!inputValue.trim() || submitFeedbackMutation.isPending}
            className="btn-primary"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: inputValue.trim() ? 1 : 0.45,
              cursor: inputValue.trim() ? "pointer" : "not-allowed"
            }}
          >
            <Send size={15} />
            {submitFeedbackMutation.isPending ? "Verzenden..." : "Verzend naar Emvi"}
          </button>
        </div>
      </form>
    </div>
  );
}