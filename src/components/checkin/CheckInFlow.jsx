import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";

function ProgressBar({ current, total }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full transition-all duration-300"
          style={{ backgroundColor: i < current ? "#FF6B00" : "#E8E6E1" }}
        />
      ))}
    </div>
  );
}

function SliderQuestion({ label, value, onChange, minLabel, midLabel, maxLabel }) {
  return (
    <div className="space-y-6">
      <p className="text-xl font-500 text-[#1A1A1A] leading-snug">{label}</p>
      <div className="px-2">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #FF6B00 0%, #FF6B00 ${(value - 1) * 25}%, #E8E6E1 ${(value - 1) * 25}%, #E8E6E1 100%)`,
            accentColor: "#FF6B00",
          }}
        />
        <div className="flex justify-between mt-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-500 transition-all"
              style={{
                backgroundColor: value === n ? "#FF6B00" : "#F7F5F2",
                color: value === n ? "#fff" : "#888888",
                transform: value === n ? "scale(1.1)" : "scale(1)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#888888]">
          <span>{minLabel}</span>
          <span>{midLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-[#FFF3EB] rounded-2xl px-5 py-3">
          <span className="text-3xl font-500 text-[#FF6B00]">{value}</span>
          <span className="text-sm text-[#888888]">/ 5</span>
        </div>
      </div>
    </div>
  );
}

function TextQuestion({ label, value, onChange, placeholder, maxLength }) {
  return (
    <div className="space-y-4">
      <p className="text-xl font-500 text-[#1A1A1A] leading-snug">{label}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="bg-white border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#BBBBBB] rounded-2xl text-base min-h-[120px] resize-none focus:border-[#FF6B00] focus:ring-[#FF6B00]"
      />
      <p className="text-xs text-[#888888] text-right">{value.length}/{maxLength}</p>
    </div>
  );
}

export default function CheckInFlow({ type, matchOpponent, onSubmit, onDefer }) {
  const isPost = type === "post";

  const steps = isPost
    ? [
        { id: "performance", kind: "slider", label: "Hoe tevreden ben ik over mijn eigen prestatie?", minLabel: "Teleurstellend", midLabel: "Redelijk", maxLabel: "Uitstekend" },
        { id: "focus_execution", kind: "slider", label: "Hoe goed heb ik mijn aandachtspunt uitgevoerd?", minLabel: "Helemaal niet", midLabel: "Deels", maxLabel: "Volledig" },
        { id: "what_went_well", kind: "text", label: "Wat ging er goed vandaag?", placeholder: "Bijv. mijn positiespel was scherp", maxLength: 150 },
        { id: "what_to_improve", kind: "text", label: "Wat wil ik volgende keer beter doen?", placeholder: "Bijv. eerder mijn positie kiezen bij omschakeling", maxLength: 150 },
      ]
    : [
        { id: "physical", kind: "slider", label: "Hoe voel ik me fysiek?", minLabel: "Beroerd", midLabel: "Oké", maxLabel: "Topfit" },
        { id: "mental", kind: "slider", label: "Hoe voel ik me mentaal?", minLabel: "Gespannen", midLabel: "Neutraal", maxLabel: "Scherp" },
        { id: "focus_point", kind: "text", label: "Mijn aandachtspunt voor vandaag", placeholder: "Bijv. meer diepte zoeken achter de linie", maxLength: 100 },
      ];

  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    physical: 3, mental: 3, focus_point: "",
    performance: 3, focus_execution: 3, what_went_well: "", what_to_improve: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const setValue = (id, val) => setValues((prev) => ({ ...prev, [id]: val }));

  const handleNext = () => {
    if (isLast) {
      onSubmit(values);
      setSubmitted(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#FFF3EB] flex items-center justify-center text-4xl">🎯</div>
        <h2 className="text-2xl font-500 text-[#1A1A1A]">
          {isPost ? "Goed gedaan!" : "Succes!"}
        </h2>
        <p className="text-[#888888]">
          {isPost ? "Reflecteren maakt je beter." : "Veel plezier straks."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">vs. {matchOpponent}</p>
        <h1 className="text-2xl font-500 text-[#1A1A1A]">
          {isPost ? "Hoe kijk jij terug op vandaag?" : "Hoe ga jij er vandaag in?"}
        </h1>
      </div>

      <ProgressBar current={step + 1} total={steps.length} />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {current.kind === "slider" ? (
              <SliderQuestion
                label={current.label}
                value={values[current.id]}
                onChange={(v) => setValue(current.id, v)}
                minLabel={current.minLabel}
                midLabel={current.midLabel}
                maxLabel={current.maxLabel}
              />
            ) : (
              <TextQuestion
                label={current.label}
                value={values[current.id]}
                onChange={(v) => setValue(current.id, v)}
                placeholder={current.placeholder}
                maxLength={current.maxLength}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-3 mt-8">
        <Button
          onClick={handleNext}
          className="w-full h-14 text-white font-500 text-base rounded-2xl"
          style={{ background: "linear-gradient(135deg,#D45A30,#FF6B00)" }}
        >
          {isLast ? "Verstuur" : (
            <span className="flex items-center gap-2">
              Volgende <ChevronRight size={18} />
            </span>
          )}
        </Button>
        {!isPost && step === 0 && onDefer && (
          <Button
            variant="ghost"
            onClick={onDefer}
            className="w-full h-12 text-[#888888] text-sm"
          >
            Later invullen
          </Button>
        )}
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-[#BBBBBB]">Stap {step + 1} van {steps.length}</p>
      </div>
    </div>
  );
}