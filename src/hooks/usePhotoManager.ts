import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { supabase } from '../utils/supabaseClient';
import { AppState } from '../types';

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.78);
    };
    img.src = url;
  });
}

export function usePhotoManager(setState: Dispatch<SetStateAction<AppState>>) {
  const [photoUploading, setPhotoUploading] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption?: string } | null>(null);

  const getSignedUrl = useCallback(
    async (path: string): Promise<string | null> => {
      if (signedUrls[path]) return signedUrls[path];
      const { data } = await supabase.storage.from('phase-photos').createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }));
        return data.signedUrl;
      }
      return null;
    },
    [signedUrls]
  );

  const uploadPhoto = async (milestoneId: string, file: File, caption: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setPhotoUploading(milestoneId);
    try {
      const compressed = await compressImage(file);
      const path = `${session.user.id}/${milestoneId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('phase-photos')
        .upload(path, compressed, { upsert: false, contentType: 'image/jpeg' });
      if (error) throw error;
      setState(prev => ({
        ...prev,
        milestones: prev.milestones.map(m =>
          m.id === milestoneId
            ? { ...m, photos: [...(m.photos ?? []), { path, caption: caption || undefined }] }
            : m
        ),
      }));
    } finally {
      setPhotoUploading(null);
    }
  };

  const deletePhoto = async (milestoneId: string, path: string) => {
    await supabase.storage.from('phase-photos').remove([path]);
    setSignedUrls(prev => { const n = { ...prev }; delete n[path]; return n; });
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === milestoneId
          ? { ...m, photos: (m.photos ?? []).filter(p => p.path !== path) }
          : m
      ),
    }));
  };

  return { photoUploading, lightboxPhoto, setLightboxPhoto, getSignedUrl, uploadPhoto, deletePhoto };
}

export type PhotoManager = ReturnType<typeof usePhotoManager>;
