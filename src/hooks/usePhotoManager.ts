import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { supabase } from '../utils/supabaseClient';
import { AppState } from '../types';

export type PhotoEntity = 'milestone' | 'material' | 'expense' | 'diary' | 'project';

const ENTITY_KEY: Record<string, string> = {
  milestone: 'milestones',
  material: 'materials',
  expense: 'expenses',
  diary: 'diary',
};

function compressImage(file: File): Promise<Blob> {
  // If not an image, return original file
  if (!file.type.startsWith('image/')) return Promise.resolve(file);
  
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

  const uploadPhoto = async (
    entity: PhotoEntity,
    entityId: string,
    file: File,
    caption: string,
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uploadKey = `${entity}:${entityId}`;
    setPhotoUploading(uploadKey);
    try {
      const isImage = file.type.startsWith('image/');
      const ext = isImage ? 'jpg' : file.name.split('.').pop() || 'file';
      const compressed = isImage ? await compressImage(file) : file;

      // Path generation
      const path = entity === 'milestone'
        ? `${session.user.id}/${entityId}/${Date.now()}.${ext}`
        : `${session.user.id}/${entity}/${entityId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('phase-photos')
        .upload(path, compressed, { 
          upsert: false, 
          contentType: isImage ? 'image/jpeg' : file.type 
        });
        
      if (error) throw error;

      if (entity === 'project') {
        setState(prev => ({
          ...prev,
          project: prev.project ? { 
            ...prev.project, 
            sitePlans: [...(prev.project.sitePlans || []), { id: Date.now().toString(), path, caption: caption || 'Untitled Plan' }] 
          } : null
        }));
      } else {
        const key = ENTITY_KEY[entity] as keyof AppState;
        setState(prev => ({
          ...prev,
          [key]: (prev[key] as { id: string; photos?: { path: string; caption?: string }[] }[]).map(item =>
            item.id === entityId
              ? { ...item, photos: [...(item.photos ?? []), { path, caption: caption || undefined }] }
              : item
          ),
        }));
      }
    } finally {
      setPhotoUploading(null);
    }
  };

  const deletePhoto = async (entity: PhotoEntity, entityId: string, path: string) => {
    await supabase.storage.from('phase-photos').remove([path]);
    setSignedUrls(prev => { const n = { ...prev }; delete n[path]; return n; });
    
    if (entity === 'project') {
      setState(prev => ({
        ...prev,
        project: prev.project ? { 
          ...prev.project, 
          sitePlans: (prev.project.sitePlans || []).filter(p => p.path !== path) 
        } : null
      }));
    } else {
      const key = ENTITY_KEY[entity] as keyof AppState;
      setState(prev => ({
        ...prev,
        [key]: (prev[key] as { id: string; photos?: { path: string; caption?: string }[] }[]).map(item =>
          item.id === entityId
            ? { ...item, photos: (item.photos ?? []).filter(p => p.path !== path) }
            : item
        ),
      }));
    }
  };

  return { photoUploading, lightboxPhoto, setLightboxPhoto, getSignedUrl, uploadPhoto, deletePhoto };
}

export type PhotoManager = ReturnType<typeof usePhotoManager>;
