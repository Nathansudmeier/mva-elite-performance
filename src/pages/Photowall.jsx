import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/components/auth/useCurrentUser";
import { Plus, Camera, X, Heart, Trash2, Images, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 24;

export default function Photowall() {
  const { user, isTrainer, isAdmin, isSpeelster } = useCurrentUser();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const canUpload = isTrainer || isAdmin || isSpeelster;
  const canDelete = isTrainer || isAdmin || isSpeelster;

  const { data: allPhotos = [], isLoading } = useQuery({
    queryKey: ["photowall"],
    queryFn: () => base44.entities.PhotoWallPost.list("-created_date"),
  });

  const displayedPhotos = allPhotos.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = page * ITEMS_PER_PAGE < allPhotos.length;

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current.disconnect();
  }, [hasMore, isLoading]);

  const handleLike = useCallback(
    (photoId, currentLikes) => {
      const isLiked = currentLikes.includes(user?.email);
      const newLikes = isLiked
        ? currentLikes.filter((e) => e !== user.email)
        : [...currentLikes, user?.email];

      // Optimistic update
      queryClient.setQueryData(["photowall"], (old) =>
        old.map((p) => (p.id === photoId ? { ...p, likes: newLikes } : p))
      );

      base44.entities.PhotoWallPost.update(photoId, { likes: newLikes });
    },
    [user?.email]
  );

  const deleteMutation = useMutation({
    mutationFn: (photoId) => base44.entities.PhotoWallPost.delete(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries(["photowall"]);
      setDeleteConfirm(null);
      setSelectedPhoto(null);
    },
  });

  const canDeletePhoto = (photo) => {
    if (!canDelete) return false;
    return isTrainer || isAdmin || photo.uploader_email === user?.email;
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1rem 0.5rem" }}>
        <h1 className="t-page-title">Foto's</h1>
        {canUpload && (
          <button
            onClick={() => setUploadOpen(true)}
            className="btn-secondary"
            style={{
              background: "#FF6800",
              border: "2.5px solid #1a1a1a",
              borderRadius: "14px",
              boxShadow: "3px 3px 0 #1a1a1a",
              height: "40px",
              padding: "0 16px",
              fontSize: "13px",
              fontWeight: 800,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} />
            Foto toevoegen
          </button>
        )}
      </div>

      {/* Masonry Grid */}
      {displayedPhotos.length === 0 && !isLoading ? (
        <div style={{ marginTop: "80px", textAlign: "center" }}>
          <Images size={48} style={{ color: "rgba(26,26,26,0.20)", margin: "0 auto" }} />
          <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,26,0.40)", marginTop: "12px" }}>Nog geen foto's</p>
          {canUpload && (
            <button
              onClick={() => setUploadOpen(true)}
              className="btn-primary"
              style={{ marginTop: "16px" }}
            >
              <Plus size={16} />
              Upload de eerste foto
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              columnCount: { xs: 2, md: 3 },
              columnGap: "4px",
              padding: "8px",
            }}
            className="photowall-grid"
          >
            {displayedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                user={user}
                onLike={() => handleLike(photo.id, photo.likes)}
                onClick={() => setSelectedPhoto(photo)}
                canDelete={canDeletePhoto(photo)}
                onDelete={() => setDeleteConfirm(photo)}
              />
            ))}
          </div>

          {/* Load more indicator */}
          <div ref={loadMoreRef} style={{ padding: "20px", textAlign: "center" }}>
            {hasMore && (
              <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                <div className="loading-dot" />
                <div className="loading-dot loading-dot-2" />
                <div className="loading-dot loading-dot-3" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Modal */}
      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          user={user}
        />
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          photo={selectedPhoto}
          allPhotos={allPhotos}
          user={user}
          onClose={() => setSelectedPhoto(null)}
          onLike={() => handleLike(selectedPhoto.id, selectedPhoto.likes)}
          canDelete={canDeletePhoto(selectedPhoto)}
          onDelete={() => {
            deleteMutation.mutate(selectedPhoto.id);
          }}
          onNavigate={(photo) => setSelectedPhoto(photo)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.60)" }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "2.5px solid #1a1a1a",
              borderRadius: "18px",
              boxShadow: "4px 4px 0 #1a1a1a",
              padding: "1.5rem",
              maxWidth: "320px",
              width: "100%",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", marginBottom: "8px" }}>Foto verwijderen?</h3>
            <p style={{ fontSize: "13px", color: "rgba(26,26,26,0.55)", marginBottom: "1.5rem" }}>
              Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  background: "#f0f0f0",
                  border: "2px solid #1a1a1a",
                  borderRadius: "12px",
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  cursor: "pointer",
                }}
              >
                Annuleren
              </button>
              <button
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                style={{
                  flex: 1,
                  background: "#FF3DA8",
                  border: "2px solid #1a1a1a",
                  borderRadius: "12px",
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {deleteMutation.isPending ? "Verwijderen..." : "Verwijderen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .photowall-grid {
          column-count: 2;
          column-gap: 4px;
        }
        @media (min-width: 768px) {
          .photowall-grid {
            column-count: 3;
          }
        }
        .photowall-grid > div {
          display: inline-block;
          width: 100%;
          margin-bottom: 4px;
          break-inside: avoid;
        }
        .loading-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FF6800;
          animation: pulse 1s ease-in-out infinite;
        }
        .loading-dot-2 {
          animation-delay: 0.2s;
        }
        .loading-dot-3 {
          animation-delay: 0.4s;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function PhotoCard({ photo, user, onLike, onClick, canDelete, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const isLiked = photo.likes?.includes(user?.email);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "10px",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <img
        src={photo.thumbnail_url || photo.photo_url}
        alt={photo.caption || "Photo"}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.20)",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.2s",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              background: "rgba(0,0,0,0.50)",
              borderRadius: "20px",
              padding: "3px 8px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {photo.uploader_name}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            style={{
              background: "rgba(0,0,0,0.50)",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isLiked ? (
              <Heart size={14} fill="#FF3DA8" style={{ color: "#FF3DA8" }} />
            ) : (
              <Heart size={14} style={{ color: "#ffffff" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose, user }) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (file, maxWidth, quality) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      const [photoDataUrl, thumbnailDataUrl] = await Promise.all([
        compressImage(selectedFile, 1200, 0.8),
        compressImage(selectedFile, 400, 0.7),
      ]);

      // Upload full photo
      const photoBlob = await (await fetch(photoDataUrl)).blob();
      const photoFile = new File([photoBlob], "photo.jpg", { type: "image/jpeg" });
      const photoRes = await base44.integrations.Core.UploadFile({ file: photoFile });

      // Upload thumbnail
      const thumbBlob = await (await fetch(thumbnailDataUrl)).blob();
      const thumbFile = new File([thumbBlob], "thumb.jpg", { type: "image/jpeg" });
      const thumbRes = await base44.integrations.Core.UploadFile({ file: thumbFile });

      return { photoRes, thumbRes };
    },
    onSuccess: async ({ photoRes, thumbRes }) => {
      await base44.entities.PhotoWallPost.create({
        photo_url: photoRes.file_url,
        thumbnail_url: thumbRes.file_url,
        uploader_email: user?.email,
        uploader_name: user?.full_name?.split(" ")[0] || user?.email,
        uploader_photo_url: user?.photo_url,
        caption: caption || "",
        likes: [],
        created_date: new Date().toISOString(),
      });
      queryClient.invalidateQueries(["photowall"]);
      onClose();
    },
    onError: (err) => {
      console.error("Upload error:", err);
      setIsUploading(false);
    },
  });

  const handleSubmit = () => {
    if (selectedFile) {
      uploadMutation.mutate();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.60)" }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderTop: "2.5px solid #1a1a1a",
          borderRadius: "22px 22px 0 0",
          padding: "1.25rem",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ background: "#1a1a1a", width: "36px", height: "4px", borderRadius: "2px", margin: "0 auto 1rem" }} />

        <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", marginBottom: "1rem" }}>Foto toevoegen</h2>

        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2.5px dashed #1a1a1a",
              borderRadius: "18px",
              minHeight: "200px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            <Camera size={48} style={{ color: "rgba(26,26,26,0.25)" }} />
            <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,26,0.45)" }}>Tik om een foto te kiezen</p>
          </div>
        ) : (
          <div style={{ marginBottom: "1rem" }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                borderRadius: "14px",
                objectFit: "cover",
                maxHeight: "300px",
                width: "100%",
              }}
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 150))}
            placeholder="Voeg een bijschrift toe (optioneel)"
            maxLength={150}
            style={{
              width: "100%",
              background: "#ffffff",
              border: "2px solid #1a1a1a",
              borderRadius: "12px",
              padding: "12px",
              fontSize: "14px",
              color: "#1a1a1a",
              boxSizing: "border-box",
            }}
          />
          <span style={{ fontSize: "11px", color: "rgba(26,26,26,0.35)", position: "absolute", right: "12px", bottom: "8px" }}>
            {caption.length}/150
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="btn-primary"
          style={{ width: "100%" }}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploaden...
            </>
          ) : (
            "Plaatsen"
          )}
        </button>
      </div>
    </div>
  );
}

function Lightbox({ photo, allPhotos, user, onClose, onLike, canDelete, onDelete, onNavigate }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const isLiked = photo.likes?.includes(user?.email);
  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);

  const navigate = useCallback(
    (direction) => {
      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < allPhotos.length) {
        onNavigate(allPhotos[newIndex]);
      }
    },
    [currentIndex, allPhotos, onNavigate]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, navigate]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) navigate(1);
    if (isRightSwipe) navigate(-1);
  };

  const formattedDate = new Date(photo.created_date).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation zones */}
      <div
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "20%", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
      >
        {currentIndex > 0 && (
          <div style={{ display: "flex", alignItems: "center", height: "100%", paddingLeft: "20px" }}>
            <ChevronLeft size={32} style={{ color: "#ffffff" }} />
          </div>
        )}
      </div>
      <div
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "20%", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(1);
        }}
      >
        {currentIndex < allPhotos.length - 1 && (
          <div style={{ display: "flex", alignItems: "center", height: "100%", paddingRight: "20px" }}>
            <ChevronRight size={32} style={{ color: "#ffffff" }} />
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          background: "rgba(255,255,255,0.15)",
          border: "1.5px solid rgba(255,255,255,0.30)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X size={20} style={{ color: "#ffffff" }} />
      </button>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={onDelete}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "rgba(255,61,168,0.20)",
            border: "1.5px solid #FF3DA8",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Trash2 size={16} style={{ color: "#FF3DA8" }} />
        </button>
      )}

      {/* Photo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: "4rem 2rem 2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.photo_url}
          alt={photo.caption || "Photo"}
          style={{
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: "12px",
          }}
        />
      </div>

      {/* Info bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "90vw",
          maxWidth: "600px",
          background: "rgba(0,0,0,0.70)",
          backdropFilter: "blur(10px)",
          borderRadius: "0 0 14px 14px",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {photo.uploader_photo_url && (
            <img
              src={photo.uploader_photo_url}
              alt={photo.uploader_name}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.30)",
                objectFit: "cover",
              }}
            />
          )}
          <div style={{ marginLeft: "8px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              {photo.uploader_name}
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.50)", margin: 0 }}>
              {formattedDate}
            </p>
          </div>
        </div>
        <button
          onClick={onLike}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isLiked ? (
            <Heart size={24} fill="#FF3DA8" style={{ color: "#FF3DA8" }} />
          ) : (
            <Heart size={24} style={{ color: "#ffffff" }} />
          )}
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
            {photo.likes?.length || 0}
          </span>
        </button>
      </div>

      {/* Caption */}
      {photo.caption && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90vw",
            maxWidth: "600px",
            padding: "0.5rem 1rem 0.75rem",
          }}
        >
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.80)", margin: 0 }}>
            {photo.caption}
          </p>
        </div>
      )}
    </div>
  );
}