import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, Video, ExternalLink, Play } from "lucide-react";

function getEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  if (url.includes("veo.co")) return url;
  return null;
}

export default function VideoHub() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", date: new Date().toISOString().split("T")[0], analysis: "" });
  const [selectedVideo, setSelectedVideo] = useState(null);

  const { data: videos = [] } = useQuery({ queryKey: ["videos"], queryFn: () => base44.entities.VideoAnalysis.list("-date") });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.VideoAnalysis.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      setDialogOpen(false);
      setForm({ title: "", video_url: "", date: new Date().toISOString().split("T")[0], analysis: "" });
    },
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-500 text-[#FF6B00]">Video Hub</h1>
          <p className="text-sm text-[#888888]">Tactische video-analyse</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
          <Plus size={16} className="mr-1" /> Video Toevoegen
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h2 className="text-sm font-500 text-[#888888] uppercase tracking-wider mb-3">Video's</h2>
          {videos.map((v) => {
            const isActive = selectedVideo?.id === v.id;
            return (
              <button key={v.id} onClick={() => setSelectedVideo(v)}
                className="w-full text-left px-4 py-3 rounded-lg transition-all elite-card elite-card-hover"
                style={isActive ? { backgroundColor: '#1A1F2E', borderColor: '#1A1F2E' } : {}}>
                <div className="flex items-center gap-2">
                  <Play size={14} style={{ color: isActive ? '#F0926E' : '#D45A30' }} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={isActive ? { color: '#fff' } : { color: '#1A1F2E' }}>{v.title}</p>
                    <p className="text-xs" style={isActive ? { color: 'rgba(255,255,255,0.7)' } : { color: '#2F3650' }}>{v.date ? format(new Date(v.date), "d MMM yyyy", { locale: nl }) : ""}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {videos.length === 0 && <p className="text-sm text-center py-8 text-white/60">Nog geen video's</p>}
        </div>

        <div className="lg:col-span-2">
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="elite-card overflow-hidden">
                {getEmbedUrl(selectedVideo.video_url) ? (
                  <div className="aspect-video">
                    <iframe src={getEmbedUrl(selectedVideo.video_url)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: '#FDE8DC' }}>
                    <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ color: '#D45A30' }}>
                      <ExternalLink size={18} /> Open Video Link
                    </a>
                  </div>
                )}
              </div>
              <div className="elite-card p-6">
                <h2 className="text-lg font-bold mb-1 text-[#1A1F2E]">{selectedVideo.title}</h2>
                <p className="text-xs mb-4" style={{ color: '#2F3650' }}>{selectedVideo.date ? format(new Date(selectedVideo.date), "d MMMM yyyy", { locale: nl }) : ""}</p>
                {selectedVideo.analysis && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: '#D45A30' }}>Tactische Analyse</h3>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#2F3650' }}>{selectedVideo.analysis}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="elite-card p-12 text-center">
              <Video size={40} className="mx-auto mb-3" style={{ color: '#FDE8DC' }} />
              <p style={{ color: '#2F3650' }}>Selecteer een video om te bekijken</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-[#FDE8DC]" style={{ backgroundColor: '#FFF5F0', color: '#1A1F2E' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1F2E' }}>Video Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
            <Input placeholder="YouTube of VEO link" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E]" style={{ backgroundColor: '#FFFFFF' }} />
            <Textarea placeholder="Tactische analyse..." value={form.analysis} onChange={(e) => setForm({ ...form, analysis: e.target.value })} className="border-[#FDE8DC] text-[#1A1F2E] h-32" style={{ backgroundColor: '#FFFFFF' }} />
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title || !form.video_url} className="w-full text-white" style={{ background: 'linear-gradient(135deg,#D45A30,#E8724A)' }}>
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}