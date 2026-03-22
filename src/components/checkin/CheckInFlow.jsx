import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function CheckInFlow({ matchId, type, onClose, onCompleted }) {
  const { playerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  useScrollLock(true);

  const [formData, setFormData] = useState({
    match_id: matchId,
    player_id: playerId,
    type: type,
    physical_score: null,
    mental_score: null,
    focus_point: "",
    performance_score: null,
    focus_execution_score: null,
    what_went_well: "",
    what_to_improve: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MatchCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchCheckIns"] });
      queryClient.invalidateQueries({ queryKey: ["myCheckIns"] });
      onCompleted?.();
    },
  });

  const steps = type === "pre"
    ? [
        { title: "Fysiek Gevoel", key: "physical_score", desc: "Hoe voel je je fysiek vandaag?" },
        { title: "Mentaal Gevoel", key: "mental_score", desc: "Wat is je mentale toestand?" },
        { title: "Aandachtspunt", key: "focus_point", desc: "Wat wil je vandaag focussen?" },
      ]
    : [
        { title: "Tevredenheid", key: "performance_score", desc: "Hoe tevreden ben je met je prestatie?" },
        { title: "Aandachtspunt Uitvoering", key: "focus_execution_score", desc: "Hoe ging je aandachtspunt?" },
        { title: "Wat ging goed?", key: "what_went_well", desc: "Wat voelde goed vandaag?" },
        { title: "Wat te verbeteren?", key: "what_to_improve", desc: "Wat kan beter volgende keer?" },
      ];

  const step = steps[currentStep];
  const isScoreStep = ["physical_score", "mental_score", "performance_score", "focus_execution_score"].includes(step.key);
  const isTextStep = ["focus_point", "what_went_well", "what_to_improve"].includes(step.key);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit
      createMutation.mutate(formData);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8E6E1]">
          <p className="text-sm font-500 text-[#888888]">
            Vraag {currentStep + 1} van {steps.length}
          </p>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F7F5F2] text-[#888888]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#F7F5F2]">
          <div className="h-full bg-[#FF6B00] transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-500 text-[#1A1A1A] mb-2">{step.title}</h2>
            <p className="text-sm text-[#888888]">{step.desc}</p>
          </div>

          {/* Score slider */}
          {isScoreStep && (
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="5"
                value={formData[step.key] || 3}
                onChange={(e) => setFormData({ ...formData, [step.key]: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#E8E6E1] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#888888]">
                <span>1 (Slecht)</span>
                <span className="text-lg font-500 text-[#FF6B00]">{formData[step.key] || 3}</span>
                <span>5 (Excellent)</span>
              </div>
            </div>
          )}

          {/* Text input */}
          {isTextStep && (
            <textarea
              value={formData[step.key] || ""}
              onChange={(e) => setFormData({ ...formData, [step.key]: e.target.value })}
              placeholder="Typ je antwoord..."
              className="w-full p-3 border border-[#E8E6E1] rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] resize-none"
              rows="4"
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-4 border-t border-[#E8E6E1]">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#E8E6E1] text-sm font-500 text-[#888888] hover:bg-[#F7F5F2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Terug
          </button>
          <button
            onClick={handleNext}
            disabled={
              (isScoreStep && !formData[step.key]) ||
              (isTextStep && !formData[step.key]?.trim())
            }
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF6B00] text-white text-sm font-500 hover:bg-[#E55A00] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === steps.length - 1 ? "Verzenden" : "Volgende"}
            {currentStep < steps.length - 1 && <ChevronRight size={16} />}
          </button>
        </div>

        {/* Later button (only for pre-game) */}
        {type === "pre" && currentStep === 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-500 text-[#888888] hover:text-[#FF6B00] rounded-xl hover:bg-[#FFF3EB] transition-colors"
            >
              Later invullen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}