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
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // VEO
  if (url.includes("veo.co")) return url;
  return null;
}

export default function VideoHub() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", date: new Date().toISOString().split("T")[0], analysis: "" });
  const [selectedVideo, setSelectedVideo] = useState(null);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: () => base44.entities.VideoAnalysis.list("-date"),
  });

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
          <h1 className="text-2xl font-black">Video Hub</h1>
          <p className="text-sm text-[#a0a0a0]">Tactische video-analyse</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[#FF6B00] hover:bg-[#e06000]">
          <Plus size={16} className="mr-1" /> Video Toevoegen
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-3">Video's</h2>
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVideo(v)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                selectedVideo?.id === v.id ? "bg-[#1a3a8f]" : "elite-card elite-card-hover"
              }`}
            >
              <div className="flex items-center gap-2">
                <Play size={14} className="text-[#FF6B00] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{v.title}</p>
                  <p className="text-xs text-[#a0a0a0]">{v.date ? format(new Date(v.date), "d MMM yyyy", { locale: nl }) : ""}</p>
                </div>
              </div>
            </button>
          ))}
          {videos.length === 0 && <p className="text-sm text-[#666] text-center py-8">Nog geen video's</p>}
        </div>

        {/* Video player + analysis */}
        <div className="lg:col-span-2">
          {selectedVideo ? (
            <div className="space-y-4">
              <div className="elite-card overflow-hidden">
                {getEmbedUrl(selectedVideo.video_url) ? (
                  <div className="aspect-video">
                    <iframe
                      src={getEmbedUrl(selectedVideo.video_url)}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center">
                    <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#FF6B00] hover:underline">
                      <ExternalLink size={18} /> Open Video Link
                    </a>
                  </div>
                )}
              </div>
              <div className="elite-card p-6">
                <h2 className="text-lg font-bold mb-1">{selectedVideo.title}</h2>
                <p className="text-xs text-[#a0a0a0] mb-4">{selectedVideo.date ? format(new Date(selectedVideo.date), "d MMMM yyyy", { locale: nl }) : ""}</p>
                {selectedVideo.analysis && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#FF6B00] mb-2">Tactische Analyse</h3>
                    <p className="text-sm text-[#a0a0a0] whitespace-pre-wrap">{selectedVideo.analysis}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="elite-card p-12 text-center">
              <Video size={40} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#666]">Selecteer een video om te bekijken</p>
            </div>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border-[#222] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Video Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
            <Input placeholder="YouTube of VEO link" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
            <Textarea placeholder="Tactische analyse..." value={form.analysis} onChange={(e) => setForm({ ...form, analysis: e.target.value })} className="bg-[#0a0a0a] border-[#333] h-32" />
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title || !form.video_url} className="w-full bg-[#FF6B00] hover:bg-[#e06000]">
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}