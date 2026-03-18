import React from "react";

/**
 * Extracts the YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url) {
  return !!getYouTubeId(url);
}

export default function YouTubeEmbed({ url, className = "" }) {
  const videoId = getYouTubeId(url);
  const [embedFailed, setEmbedFailed] = React.useState(false);

  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (embedFailed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative w-full overflow-hidden rounded-xl block group ${className}`}
        style={{ aspectRatio: "16/9" }}
      >
        <img src={thumbnailUrl} alt="YouTube video" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 group-hover:bg-black/50 transition-colors">
          <div className="w-14 h-14 bg-[#FF0000] rounded-full flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-t-[9px] border-b-[9px] border-l-[16px] border-t-transparent border-b-transparent border-l-white ml-1" />
          </div>
          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">Openen in YouTube</span>
        </div>
      </a>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
      style={{ paddingTop: "56.25%" }}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setEmbedFailed(true)}
      />
      {/* Fallback trigger: detect embed block via postMessage */}
      <EmbedErrorDetector videoId={videoId} onFail={() => setEmbedFailed(true)} />
    </div>
  );
}

function EmbedErrorDetector({ videoId, onFail }) {
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data && typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "onError" && (msg.info === 150 || msg.info === 101)) {
            onFail();
          }
        } catch (_) {}
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [videoId, onFail]);
  return null;
}