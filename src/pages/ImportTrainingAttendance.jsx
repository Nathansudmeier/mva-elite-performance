import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

export default function ImportTrainingAttendance() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Selecteer alstublieft een Excel-bestand");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Upload file to get URL
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.url;

      // Extract data from Excel with flexible schema
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {},
          additionalProperties: true
        }
      });

      if (extractRes.status !== "success") {
        setError(`Fout bij het lezen van het Excel-bestand: ${extractRes.details}`);
        setLoading(false);
        return;
      }

      // Transform data: rows[0] has training headers, rows[1+] have player data
      const rows = Array.isArray(extractRes.output) ? extractRes.output : [extractRes.output];
      
      if (rows.length < 2) {
        setError("Excel-bestand bevat onvoldoende gegevens");
        setLoading(false);
        return;
      }

      const headers = Object.keys(rows[0]).filter(key => key !== 'Naam');
      const attendanceData = {};

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const playerName = row.Naam;

        if (!playerName) continue;

        attendanceData[playerName] = {};
        for (const header of headers) {
          const value = row[header];
          // Convert to 1 or 0
          if (value === 1 || value === "1") {
            attendanceData[playerName][header] = 1;
          } else if (value === 0 || value === "0") {
            attendanceData[playerName][header] = 0;
          }
        }
      }

      // Call backend function
      const result = await base44.functions.invoke('importTrainingAttendance', {
        attendanceData
      });

      setMessage(`✓ ${result.data.created} trainingsgegevens toegevoegd (${result.data.skipped} overgeslagen)`);
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(`Fout: ${err.message || 'Onbekende fout'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "#1c0e04" }}>
      <div className="max-w-2xl mx-auto">
        <div className="glass p-8 rounded-2xl">
          <h1 className="t-page-title mb-2">Trainingsgegevens importeren</h1>
          <p className="t-secondary mb-6">Upload je Excel-bestand met trainingsaanwezigheid</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="t-secondary text-red-400">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-500/15 border border-green-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="t-secondary text-green-400">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="border-2 border-dashed border-orange-500/40 rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "#FF8C3A" }} />
                <p className="t-card-title mb-1">
                  {file ? file.name : "Klik om bestand te selecteren"}
                </p>
                <p className="t-secondary">of sleep het bestand hierheen</p>
              </label>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full btn-primary"
            >
              {loading ? "Verwerken..." : "Gegevens importeren"}
            </Button>
          </div>

          <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <p className="t-secondary mb-2">
              <strong>Format:</strong> Eerste kolom bevat speelsterspelers, volgende kolommen trainingen met datum/tijd
            </p>
            <p className="t-secondary">
              <strong>Waarden:</strong> 1 = aanwezig, 0 = afwezig
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}