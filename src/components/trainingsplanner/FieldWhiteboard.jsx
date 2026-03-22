import React, { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";

const FIELD_COLOR = "#1a4a2e";
const LINE_COLOR = "rgba(255,255,255,0.55)";

export default function FieldWhiteboard({ value, onChange, mobile = false }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#FF6B00");
  const [fullscreen, setFullscreen] = useState(false);
  const lastPos = useRef(null);

  const colors = ["#FF6B00", "#ffffff", "#4ade80", "#f87171", "#60a5fa", "#fbbf24"];

  function drawField(ctx, w, h) {
    ctx.fillStyle = FIELD_COLOR;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 1.5;
    // Outer
    ctx.strokeRect(8, 8, w - 16, h - 16);
    // Centre line
    ctx.beginPath(); ctx.moveTo(8, h / 2); ctx.lineTo(w - 8, h / 2); ctx.stroke();
    // Centre circle
    ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.12, 0, Math.PI * 2); ctx.stroke();
    // Centre dot
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2); ctx.fillStyle = LINE_COLOR; ctx.fill();
    // Penalty areas
    const pw = (w - 16) * 0.55, ph = (h - 16) * 0.22;
    ctx.strokeRect(8 + (w - 16 - pw) / 2, 8, pw, ph);
    ctx.strokeRect(8 + (w - 16 - pw) / 2, h - 8 - ph, pw, ph);
    // Goal areas
    const gw = (w - 16) * 0.28, gh = (h - 16) * 0.09;
    ctx.strokeRect(8 + (w - 16 - gw) / 2, 8, gw, gh);
    ctx.strokeRect(8 + (w - 16 - gw) / 2, h - 8 - gh, gw, gh);
  }

  function initCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    drawField(ctx, w, h);
    if (value) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = value;
    }
  }

  useEffect(() => { initCanvas(canvasRef.current); }, [fullscreen]);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  }

  function doDraw(e) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw() {
    setDrawing(false);
    lastPos.current = null;
    if (onChange) onChange(canvasRef.current.toDataURL());
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawField(ctx, canvas.width, canvas.height);
    if (onChange) onChange(canvas.toDataURL());
  }

  const canvasEl = (
    <canvas
      ref={canvasRef}
      width={400}
      height={280}
      style={{ width: "100%", height: fullscreen ? "calc(100% - 100px)" : "180px", borderRadius: "10px", cursor: "crosshair", touchAction: "none", display: "block" }}
      onMouseDown={startDraw}
      onMouseMove={doDraw}
      onMouseUp={stopDraw}
      onMouseLeave={stopDraw}
      onTouchStart={startDraw}
      onTouchMove={doDraw}
      onTouchEnd={stopDraw}
    />
  );

  if (mobile && !fullscreen) {
    return (
      <button
        onClick={() => setFullscreen(true)}
        style={{ width: "100%", height: "44px", background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#FF8C3A", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
      >
        <i className="ti ti-pencil" style={{ fontSize: "16px" }} />
        Teken veld
      </button>
    );
  }

  const toolbar = (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
      {colors.map(c => (
        <button
          key={c}
          onClick={() => setColor(c)}
          style={{ width: mobile ? "44px" : "24px", height: mobile ? "44px" : "24px", borderRadius: "50%", background: c, border: color === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)", cursor: "pointer", flexShrink: 0 }}
        />
      ))}
      <button
        onClick={clearCanvas}
        style={{ marginLeft: "auto", fontSize: "11px", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "4px 10px", cursor: "pointer" }}
      >
        Wis
      </button>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="modal-scroll-content" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,10,2,0.98)", padding: "16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Velddiagram</p>
          <button onClick={() => setFullscreen(false)} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={18} color="#fff" />
          </button>
        </div>
        {toolbar}
        {canvasEl}
      </div>
    );
  }

  return (
    <div>
      {toolbar}
      {canvasEl}
    </div>
  );
}