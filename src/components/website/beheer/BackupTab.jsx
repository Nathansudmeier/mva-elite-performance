import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function BackupTab() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const downloadBackup = async () => {
    setLoading(true);
    const response = await base44.functions.invoke("databaseBackup", {});
    const data = response.data;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artemis-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const totalRecords = Object.values(data.entities || {}).reduce((sum, arr) => sum + arr.length, 0);
    setLastBackup({ time: new Date(), totalRecords, entityCount: Object.keys(data.entities || {}).length });
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <div className="glass" style={{ padding: "24px" }}>
        <div className="t-section-title" style={{ marginBottom: "8px" }}>Database backup</div>
        <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.60)", marginBottom: "24px", lineHeight: 1.6 }}>
          Download een volledige JSON-backup van alle data in de applicatie. 
          Sla dit bestand veilig op als reserve tegen storingen of dataverlies.
        </p>

        <button
          className="btn-primary"
          onClick={downloadBackup}
          disabled={loading}
          style={{ width: "auto", gap: "8px" }}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Backup wordt gemaakt...
            </>
          ) : (
            <>↓ Backup downloaden</>
          )}
        </button>

        {lastBackup && (
          <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(8,208,104,0.08)", border: "1.5px solid rgba(8,208,104,0.25)", borderRadius: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#05a050", marginBottom: "4px" }}>✓ Backup succesvol</div>
            <div style={{ fontSize: "12px", color: "rgba(26,26,26,0.60)" }}>
              {lastBackup.totalRecords} records uit {lastBackup.entityCount} entiteiten gedownload op {lastBackup.time.toLocaleTimeString("nl-NL")}
            </div>
          </div>
        )}
      </div>

      <div className="glass" style={{ padding: "18px", marginTop: "16px", background: "rgba(255,214,0,0.06)", border: "1.5px solid rgba(255,214,0,0.30)", borderRadius: "14px" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, color: "#cc9900", marginBottom: "6px" }}>💡 Tip</div>
        <div style={{ fontSize: "12px", color: "rgba(26,26,26,0.65)", lineHeight: 1.6 }}>
          Maak regelmatig een backup, bij voorkeur wekelijks. Sla het bestand op in Google Drive of een andere veilige locatie.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}