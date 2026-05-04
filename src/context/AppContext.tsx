import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';
import { AppState } from '../types';
import { SyncStatus } from '../hooks/useCloudSync';
import { AppCalculations } from '../hooks/useAppCalculations';
import { PhotoManager } from '../hooks/usePhotoManager';

export type TabType = 'dashboard' | 'construction' | 'demolition' | 'kiraya' | 'settings';

export interface ConfirmDialogState {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export interface PwFormState {
  open: boolean;
  newPw: string;
  confirmPw: string;
  loading: boolean;
  error: string;
  success: string;
}

export interface AppContextValue {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  calcs: AppCalculations;

  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  subTab: string;
  setSubTab: (tab: string) => void;

  confirmDialog: ConfirmDialogState;
  askConfirm: (message: string, onConfirm: () => void, title?: string, confirmText?: string) => void;
  closeConfirm: () => void;

  sync: {
    status: SyncStatus;
    syncNow: () => Promise<void>;
    lastSynced: Date | null;
    error: string | null;
    userEmail: string | null;
    cloudUpdatedAt: Date | null;
  };

  photos: PhotoManager;

  pwForm: PwFormState;
  setPwForm: Dispatch<SetStateAction<PwFormState>>;
  handleChangePassword: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;

  exportToCSV: () => void;
  shareOnWhatsApp: () => void;

  showAllMisc: boolean;
  setShowAllMisc: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export const AppProvider = AppContext.Provider;

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    message: '',
    onConfirm: () => {},
  });

  const askConfirm = (message: string, onConfirm: () => void, title?: string, confirmText?: string) => {
    setConfirmDialog({ open: true, title, message, confirmText, onConfirm });
  };

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

  return { confirmDialog, askConfirm, closeConfirm };
}
