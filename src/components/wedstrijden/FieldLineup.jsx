import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const FORMATION_SLOTS = {
  "4-3-3": [
    { id: "GK",  label: "K",   x: 46, y: 84 },
    { id: "RB",  label: "RB",  x: 76, y: 68 },
    { id: "CB2", label: "CV",  x: 58, y: 68 },
    { id: "CB1", label: "CV",  x: 38, y: 68 },
    { id: "LB",  label: "LB",  x: 20, y: 68 },
    { id: "RM",  label: "RM",  x: 76, y: 47 },
    { id: "CM",  label: "CM",  x: 46, y: 45 },
    { id: "LM",  label: "LM",  x: 16, y: 47 },
    { id: "RW",  label: "RV",  x: 76, y: 20 },
    { id: "ST",  label: "SP",  x: 46, y: 13 },
    { id: "LW",  label: "LV",  x: 16, y: 20 },
  ],
  "4-4-2": [
    { id: "GK",  label: "K",   x: 46, y: 84 },
    { id: "RB",  label: "RB",  x: 78, y: 68 },
    { id: "CB2", label: "CV",  x: 59, y: 68 },
    { id: "CB1", label: "CV",  x: 37, y: 68 },
    { id: "LB",  label: "LB",  x: 18, y: 68 },
    { id: "RM",  label: "RM",  x: 78, y: 47 },
    { id: "CM2", label: "CM",  x: 59, y: 47 },
    { id: "CM1", label: "CM",  x: 37, y: 47 },
    { id: "LM",  label: "LM",  x: 18, y: 47 },
    { id: "ST2", label: "SP",  x: 60, y: 15 },
    { id: "ST1", label: "SP",  x: 36, y: 15 },
  ],
  "3-5-2": [
    { id: "GK",  label: "K",   x: 46, y: 84 },
    { id: "CB3", label: "CV",  x: 66, y: 68 },
    { id: "CB2", label: "CV",  x: 46, y: 68 },
    { id: "CB1", label: "CV",  x: 26, y: 68 },
    { id: "RWB", label: "RWB", x: 86, y: 50 },
    { id: "RM",  label: "RM",  x: 65, y: 45 },
    { id: "CM",  label: "CM",  x: 46, y: 43 },
    { id: "LM",  label: "LM",  x: 27, y: 45 },
    { id: "LWB", label: "LWB", x: 10, y: 50 },
    { id: "ST2", label: "SP",  x: 60, y: 15 },
    { id: "ST1", label: "SP",  x: 36, y: 15 },
  ],
  "4-2-3-1": [
    { id: "GK",   label: "K",  x: 46, y: 84 },
    { id: "RB",   label: "RB", x: 76, y: 69 },
    { id: "CB2",  label: "CV", x: 58, y: 69 },
    { id: "CB1",  label: "CV", x: 38, y: 69 },
    { id: "LB",   label: "LB", x: 20, y: 69 },
    { id: "CDM2", label: "DM", x: 57, y: 56 },
    { id: "CDM1", label: "DM", x: 37, y: 56 },
    { id: "RAM",  label: "AM", x: 74, y: 36 },
    { id: "CAM",  label: "AM", x: 46, y: 34 },
    { id: "LAM",  label: "AM", x: 18, y: 36 },
    { id: "ST",   label: "SP", x: 46, y: 13 },
  ],
  "3-4-3": [
    { id: "GK",  label: "K",  x: 46, y: 84 },
    { id: "CB3", label: "CV", x: 65, y: 68 },
    { id: "CB2", label: "CV", x: 46, y: 68 },
    { id: "CB1", label: "CV", x: 27, y: 68 },
    { id: "RM",  label: "RM", x: 80, y: 47 },
    { id: "CM2", label: "CM", x: 59, y: 47 },
    { id: "CM1", label: "CM", x: 37, y: 47 },
    { id: "LM",  label: "LM", x: 16, y: 47 },
    { id: "RW",  label: "RV", x: 74, y: 20 },
    { id: "ST",  label: "SP", x: 46, y: 13 },
    { id: "LW",  label: "LV", x: 18, y: 20 },
  ],
};

export default function FieldLineup({ players, lineupMap, formation, onLineupChange, readOnly = false }) {
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS["4-3-3"];
  const assignedIds = new Set(Object.values(lineupMap));
  const benchPlayers = players.filter((p) => !assignedIds.has(p.id));

  const onDragEnd = (result) => {
    if (readOnly) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const srcId = source.droppableId;
    const dstId = destination.droppableId;
    if (srcId === dstId) return;

    const newLineup = { ...lineupMap };

    if (srcId === "bench") {
      if (dstId !== "bench") {
        newLineup[dstId] = draggableId;
      }
    } else {
      if (dstId === "bench") {
        delete newLineup[srcId];
      } else {
        const dstOccupant = newLineup[dstId];
        newLineup[dstId] = draggableId;
        if (dstOccupant) {
          newLineup[srcId] = dstOccupant;
        } else {
          delete newLineup[srcId];
        }
      }
    }

    onLineupChange(newLineup);
  };

  // Read-only view: just the field, no bench/drag
  if (readOnly) {
    return (
      <div
        className="relative w-full mx-auto"
        style={{
          maxWidth: 300,
          aspectRatio: "2/3",
          borderRadius: 12,
          overflow: "hidden",
          background: "linear-gradient(180deg, #1a5228 0%, #1e5c2e 40%, #1e5c2e 60%, #1a5228 100%)",
        }}
      >
        <FieldMarkings />
        {slots.map((slot) => {
          const playerId = lineupMap[slot.id];
          const player = playerId ? players.find((p) => p.id === playerId) : null;
          return (
            <div
              key={slot.id}
              style={{
                position: "absolute",
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: "translate(-50%, -50%)",
                width: 52,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              {player ? (
                <>
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-black text-white"
                    style={{ border: "2px solid #E8724A", backgroundColor: "#D45A30", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
                  >
                    {player.photo_url
                      ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
                      : player.name?.charAt(0)}
                  </div>
                  <span
                    className="text-white text-[9px] font-bold text-center leading-tight mt-0.5"
                    style={{ maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                  >
                    {player.shirt_number ? `#${player.shirt_number} ` : ""}{player.name?.split(" ")[0]}
                  </span>
                </>
              ) : (
                <div
                  className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(0,0,0,0.1)" }}
                >
                  <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>{slot.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: "100vw", boxSizing: "border-box", overflowX: "hidden" }}
        className="md:flex-row md:items-start md:gap-4">
        {/* Football field */}
        <div
          className="relative w-full md:w-auto"
          style={{
            maxWidth: "100%",
            aspectRatio: "2/3",
            borderRadius: 12,
            overflow: "hidden",
            background: "linear-gradient(180deg, #1a5228 0%, #1e5c2e 40%, #1e5c2e 60%, #1a5228 100%)",
            flexShrink: 0,
          }}
        >
          <FieldMarkings />
          {slots.map((slot) => {
            const playerId = lineupMap[slot.id];
            const player = playerId ? players.find((p) => p.id === playerId) : null;
            return (
              <Droppable key={slot.id} droppableId={slot.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      position: "absolute",
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      transform: "translate(-50%, -50%)",
                      width: 52,
                      minHeight: 46,
                      zIndex: 10,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {player ? (
                      <Draggable draggableId={player.id} index={0}>
                        {(dp, ds) => (
                          <div
                            ref={dp.innerRef}
                            {...dp.draggableProps}
                            {...dp.dragHandleProps}
                            style={{ ...dp.draggableProps.style, cursor: "grab" }}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-black text-white"
                              style={{
                                border: `2px solid ${ds.isDragging ? "#F0926E" : "#E8724A"}`,
                                backgroundColor: "#D45A30",
                                boxShadow: ds.isDragging ? "0 0 10px rgba(240,146,110,0.9)" : "0 2px 6px rgba(0,0,0,0.4)",
                              }}
                            >
                              {player.photo_url
                                ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
                                : player.name?.charAt(0)}
                            </div>
                            <span
                              className="text-white text-[9px] font-bold text-center leading-tight mt-0.5"
                              style={{ maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                            >
                              {player.shirt_number ? `#${player.shirt_number} ` : ""}{player.name?.split(" ")[0]}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div
                          className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center"
                          style={{
                            borderColor: snapshot.isDraggingOver ? "#F0926E" : "rgba(255,255,255,0.35)",
                            backgroundColor: snapshot.isDraggingOver ? "rgba(240,146,110,0.2)" : "rgba(0,0,0,0.1)",
                          }}
                        >
                          <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>{slot.label}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "none" }}>{provided.placeholder}</div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>

        {/* Bench — visible player list */}
        <Droppable droppableId="bench" direction="vertical">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 80,
                borderRadius: 8,
                padding: "6px 4px",
                backgroundColor: snapshot.isDraggingOver ? "rgba(240,146,110,0.15)" : "transparent",
                transition: "background-color 0.2s",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[#888888]">
                Selectie
              </p>
              {benchPlayers.map((player, index) => (
                <Draggable key={player.id} draggableId={player.id} index={index}>
                  {(dp, ds) => (
                    <div
                      ref={dp.innerRef}
                      {...dp.draggableProps}
                      {...dp.dragHandleProps}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab"
                      style={{
                        ...dp.draggableProps.style,
                        marginBottom: 4,
                        backgroundColor: ds.isDragging ? "#D45A30" : "#FFFFFF",
                        border: "1px solid #E8E6E1",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: "#D45A30" }}
                      >
                        {player.photo_url
                          ? <img src={player.photo_url} className="w-full h-full object-cover" alt="" />
                          : player.name?.charAt(0)}
                      </div>
                      <span className="text-[11px] font-semibold truncate leading-tight text-[#1A1A1A]">
                        {player.shirt_number ? `#${player.shirt_number} ` : ""}{player.name?.split(" ")[0]}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}

function FieldMarkings() {
  return (
    <>
      {/* Grass stripes */}
      <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 25px, transparent 25px, transparent 50px)" }} />
      {/* Outer border */}
      <div className="absolute" style={{ inset: "3%", border: "2px solid rgba(255,255,255,0.4)", borderRadius: 3 }} />
      {/* Center line */}
      <div className="absolute" style={{ top: "50%", left: "3%", right: "3%", height: 2, backgroundColor: "rgba(255,255,255,0.4)" }} />
      {/* Center circle */}
      <div className="absolute rounded-full" style={{ width: "30%", aspectRatio: "1", top: "50%", left: "50%", transform: "translate(-50%, -50%)", border: "2px solid rgba(255,255,255,0.4)" }} />
      {/* Center spot */}
      <div className="absolute rounded-full" style={{ width: 8, height: 8, top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "rgba(255,255,255,0.5)" }} />
      {/* Penalty box top */}
      <div className="absolute" style={{ top: "3%", left: "22%", right: "22%", height: "17%", borderLeft: "2px solid rgba(255,255,255,0.4)", borderRight: "2px solid rgba(255,255,255,0.4)", borderBottom: "2px solid rgba(255,255,255,0.4)" }} />
      {/* Goal area top */}
      <div className="absolute" style={{ top: "3%", left: "36%", right: "36%", height: "7%", borderLeft: "2px solid rgba(255,255,255,0.25)", borderRight: "2px solid rgba(255,255,255,0.25)", borderBottom: "2px solid rgba(255,255,255,0.25)" }} />
      {/* Penalty box bottom */}
      <div className="absolute" style={{ bottom: "3%", left: "22%", right: "22%", height: "17%", borderLeft: "2px solid rgba(255,255,255,0.4)", borderRight: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid rgba(255,255,255,0.4)" }} />
      {/* Goal area bottom */}
      <div className="absolute" style={{ bottom: "3%", left: "36%", right: "36%", height: "7%", borderLeft: "2px solid rgba(255,255,255,0.25)", borderRight: "2px solid rgba(255,255,255,0.25)", borderTop: "2px solid rgba(255,255,255,0.25)" }} />
      {/* Goal top */}
      <div className="absolute" style={{ top: "1.5%", left: "42%", right: "42%", height: "2%", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
      {/* Goal bottom */}
      <div className="absolute" style={{ bottom: "1.5%", left: "42%", right: "42%", height: "2%", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
    </>
  );
}