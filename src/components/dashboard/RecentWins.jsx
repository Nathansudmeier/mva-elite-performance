import React from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Camera, Users } from "lucide-react";

export default function RecentWins({ winningTeams, players }) {
  const getName = (id) => players.find((p) => p.id === id)?.name || "Onbekend";

  const sorted = [...winningTeams].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="elite-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor:'#FDE8DC'}}>
          <Camera size={20} style={{color:'#D45A30'}} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1A1F2E]">Recente Winnaars</h2>
          <p className="text-xs text-[#2F3650]">Laatste winnende teams</p>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((wt) => (
          <div key={wt.id} className="rounded-lg p-4" style={{backgroundColor:'#FDE8DC'}}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{color:'#D45A30'}}>
                {format(new Date(wt.date), "d MMM yyyy", { locale: nl })}
              </span>
              <span className="text-xs flex items-center gap-1" style={{color:'#2F3650'}}>
                <Users size={12} /> {wt.winning_player_ids?.length || 0}
              </span>
            </div>
            {wt.photo_url && (
              <img src={wt.photo_url} alt="Winning team" className="w-full h-32 object-cover rounded-lg mb-2" />
            )}
            <div className="flex flex-wrap gap-1">
              {wt.winning_player_ids?.map((id) => (
                <span key={id} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:'#FFF5F0', color:'#2F3650'}}>
                  {getName(id)?.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-center py-4" style={{color:'#2F3650'}}>Nog geen winnende teams geregistreerd</p>
        )}
      </div>
    </div>
  );
}