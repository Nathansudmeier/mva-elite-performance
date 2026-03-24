import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";

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

  return (
    <div className="pb-20 xl:pb-8" style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: "16px"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #FF6800 0%, #FF8F3A 100%)",
        border: "2.5px solid #1a1a1a",
        borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        padding: "16px",
        textAlign: "center"
      }}>
        <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" alt="Emvi" style={{ height: "80px", marginBottom: "12px", margin: "0 auto 12px" }} />
        <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff", marginBottom: "4px" }}>
          Praat met Emvi
        </h1>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>
          Stel vragen, deel tips of geef feedback
        </p>
      </div>

      {/* Chat area */}
      <div style={{
        background: "#ffffff",
        border: "2.5px solid #1a1a1a",
        borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minHeight: "300px",
        maxHeight: "500px",
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
            <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" alt="Emvi" style={{ height: "50px", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255,104,0,0.10)",
              border: "1.5px solid #FF6800",
              borderRadius: "14px",
              padding: "12px",
              maxWidth: "80%"
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
                borderRadius: "14px",
                padding: "12px",
                maxWidth: "80%",
                wordWrap: "break-word"
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  {msg.feedbackType === "vraag" ? "❓ Vraag" : msg.feedbackType === "tip" ? "💡 Tip" : "📝 Opmerking"}
                </p>
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
              <img src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" alt="Emvi" style={{ height: "45px", flexShrink: 0 }} />
              <div style={{
                background: "rgba(255,104,0,0.10)",
                border: "1.5px solid #FF6800",
                borderRadius: "14px",
                padding: "12px",
                maxWidth: "80%"
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
      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "#ffffff",
        border: "2.5px solid #1a1a1a",
        borderRadius: "18px",
        boxShadow: "3px 3px 0 #1a1a1a",
        padding: "16px"
      }}>
        {/* Type selector */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: "vraag", label: "❓ Vraag", color: "#60a5fa" },
            { value: "tip", label: "💡 Tip", color: "#8b5cf6" },
            { value: "opmerking", label: "📝 Opmerking", color: "#f59e0b" }
          ].map(option => (
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
                transition: "all 0.15s"
              }}
            >
              {option.label}
            </button>
          ))}
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
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "2.5px solid #1a1a1a",
            background: inputValue.trim() ? "#FF6800" : "rgba(26,26,26,0.10)",
            color: inputValue.trim() ? "#ffffff" : "rgba(26,26,26,0.30)",
            fontWeight: 800,
            fontSize: "13px",
            cursor: inputValue.trim() ? "pointer" : "not-allowed",
            boxShadow: inputValue.trim() ? "3px 3px 0 #1a1a1a" : "none",
            transition: "all 0.1s"
          }}
        >
          {submitFeedbackMutation.isPending ? "Verzenden..." : "Verzend naar Emvi"}
        </button>
      </form>
    </div>
  );
}