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

  return (
    <div className="flex flex-col h-screen bg-background pb-20 xl:pb-8 gap-3 md:gap-4">
      {/* Emvi Character - Top */}
      <div className="flex justify-center pt-2 md:pt-4">
        <img 
          src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/91f794581_Emvi-top.png" 
          alt="Emvi" 
          className="h-32 md:h-40 object-contain"
        />
      </div>

      {/* Header Card */}
      <div className="glass mx-4 md:mx-6 bg-orange-600" style={{ background: "#FF6800" }}>
        <div className="p-4 md:p-5 text-center flex flex-col items-center gap-2">
          <h1 className="t-page-title text-white">
            Praat met Emvi
          </h1>
          <p className="t-secondary text-white/85">
            Stel vragen, deel tips of geef feedback
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 flex flex-col gap-3"
      >
        {/* Initial greeting */}
        {messages.length === 0 && (
          <div className="flex gap-3 items-end">
            <img 
              src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" 
              alt="Emvi" 
              className="h-10 md:h-12 flex-shrink-0"
            />
            <div className="flex-1 max-w-xs md:max-w-md" style={{ background: "rgba(255,104,0,0.12)", border: "1.5px solid rgba(255,104,0,0.30)" }}>
              <div className="rounded-xl p-3 md:p-4">
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF6800", lineHeight: 1.4 }}>
                  Hallo! Ik ben Emvi! 👋 Heb je een vraag, tip of opmerking? Ik ben hier om te helpen!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className="space-y-2">
            {/* User message */}
            <div className="flex gap-3 justify-end">
              <div className="max-w-xs md:max-w-md" style={{ background: "#FF6800" }}>
                <div className="rounded-xl p-3 md:p-4 text-white">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold">
                    {getTypeIcon(msg.feedbackType)}
                    {msg.feedbackType === "vraag" ? "Vraag" : msg.feedbackType === "tip" ? "Tip" : "Opmerking"}
                  </div>
                  <p style={{ fontSize: "12px", lineHeight: 1.4 }}>
                    {msg.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Emvi response */}
            <div className="flex gap-3 items-end">
              <img 
                src="https://media.base44.com/images/public/69ad40ab17517be2ed782cdd/b89b92670_Emvi-chat.png" 
                alt="Emvi" 
                className="h-9 md:h-11 flex-shrink-0"
              />
              <div className="flex-1 max-w-xs md:max-w-md" style={{ background: "rgba(255,104,0,0.12)", border: "1.5px solid rgba(255,104,0,0.30)" }}>
                <div className="rounded-xl p-3 md:p-4">
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF6800", lineHeight: 1.4 }}>
                    {getEmviResponse(msg.feedbackType)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="glass mx-4 md:mx-6 mb-4">
        <div className="p-4 md:p-5 space-y-3 md:space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2 flex-wrap">
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
                  className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all border-2"
                  style={{
                    borderColor: isSelected ? "#FF6800" : "rgba(26,26,26,0.15)",
                    background: isSelected ? "rgba(255,104,0,0.12)" : "transparent",
                    color: isSelected ? "#FF6800" : "rgba(26,26,26,0.50)"
                  }}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Input Textarea */}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedType === "vraag" ? "Stel je vraag..." :
              selectedType === "tip" ? "Deel je tip..." :
              "Geef je opmerking..."
            }
            className="w-full rounded-lg border-2 border-border p-3 md:p-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-600"
            style={{ minHeight: "80px", fontSize: "13px", fontFamily: "inherit" }}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || submitFeedbackMutation.isPending}
            className="btn-primary flex items-center justify-center gap-2"
            style={{
              opacity: inputValue.trim() ? 1 : 0.5,
              cursor: inputValue.trim() ? "pointer" : "not-allowed"
            }}
          >
            <Send size={16} />
            {submitFeedbackMutation.isPending ? "Verzenden..." : "Verzend naar Emvi"}
          </button>
        </div>
      </form>
    </div>
  );
}