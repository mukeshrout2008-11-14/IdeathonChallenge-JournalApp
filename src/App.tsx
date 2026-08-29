/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppUser, JournalEntry, ToastMessage, VaultSettings } from './types';
import { subscribeToAuth } from './lib/firebase';
import { 
  subscribeToUserEntries, 
  saveJournalEntry, 
  deleteJournalEntry, 
  togglePinJournalEntry 
} from './services/firestore';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { SidebarHistory } from './components/SidebarHistory';
import { JournalEditor } from './components/JournalEditor';
import { CognitiveRadarModal } from './components/CognitiveRadarModal';
import { AskPastSelfModal } from './components/AskPastSelfModal';
import { BiorythmVisualizer } from './components/BiorythmVisualizer';
import { VaultPinModal } from './components/VaultPinModal';
import { ToastContainer } from './components/Toast';
import { Sparkles, Lock } from 'lucide-react';

function createNewEntryTemplate(userId: string): JournalEntry {
  const timestamp = Date.now();
  return {
    id: `entry-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title: 'New Reflection',
    category: 'Reflection',
    summary: '',
    tags: ['reflection'],
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: false,
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  
  // Modals state
  const [showCognitiveRadar, setShowCognitiveRadar] = useState(false);
  const [showAskPastSelf, setShowAskPastSelf] = useState(false);
  const [showBiorythm, setShowBiorythm] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultModalMode, setVaultModalMode] = useState<'setup' | 'unlock' | 'manage'>('manage');
  const [pendingEntryToUnlock, setPendingEntryToUnlock] = useState<JournalEntry | null>(null);

  // Vault Settings Persistence (Client-side localStorage with owner isolation)
  const [vaultSettings, setVaultSettings] = useState<VaultSettings>(() => {
    try {
      const saved = localStorage.getItem('reflect_vault_settings');
      return saved ? JSON.parse(saved) : { isPinEnabled: false, lockedEntryIds: [] };
    } catch {
      return { isPinEnabled: false, lockedEntryIds: [] };
    }
  });

  const [unlockedSessionIds, setUnlockedSessionIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleUpdateVaultSettings = (newSettings: VaultSettings) => {
    setVaultSettings(newSettings);
    try {
      localStorage.setItem('reflect_vault_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save vault settings:', e);
    }
  };

  // Toast Management
  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string, actionLabel?: string, onAction?: () => void) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, actionLabel, onAction }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Subscribe to Firebase Authentication state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Firestore entries for authenticated user
  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      setSelectedEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (updatedEntries) => {
        setEntries(updatedEntries);
        // If current selected entry is in list, sync it; or keep active
        setSelectedEntry((current) => {
          if (!current) {
            return updatedEntries.length > 0 ? updatedEntries[0] : createNewEntryTemplate(currentUser.uid);
          }
          const matched = updatedEntries.find((e) => e.id === current.id);
          return matched || current;
        });
      },
      (err) => {
        console.error('Failed to sync entries from Firestore:', err);
        addToast('error', 'Failed to synchronize entries with Cloud Firestore.');
      }
    );

    return () => unsubscribe();
  }, [currentUser, addToast]);

  // Create new blank reflection
  const handleNewEntry = () => {
    if (!currentUser) return;
    const newEntry = createNewEntryTemplate(currentUser.uid);
    setSelectedEntry(newEntry);
    setIsOpenMobileSidebar(false);
  };

  // Select an existing reflection (with Vault Lock check)
  const handleSelectEntry = (entry: JournalEntry) => {
    const isLocked = vaultSettings.isPinEnabled && 
                     vaultSettings.lockedEntryIds.includes(entry.id) &&
                     !unlockedSessionIds.includes(entry.id);

    if (isLocked) {
      setPendingEntryToUnlock(entry);
      setVaultModalMode('unlock');
      setShowVaultModal(true);
      return;
    }

    setSelectedEntry(entry);
  };

  // Update & persist entry to Firestore with guaranteed hygiene
  const handleUpdateEntry = async (updated: JournalEntry) => {
    if (!currentUser) return;
    
    // Update local state immediately
    setSelectedEntry(updated);

    try {
      setIsSaving(true);
      await saveJournalEntry(currentUser.uid, updated);
    } catch (error: any) {
      console.error('Firestore save failed:', error);
      addToast(
        'error',
        `Save failed: ${error.message || 'Network error'}.`,
        'Retry',
        () => handleUpdateEntry(updated)
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete reflection from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      addToast('success', 'Reflection deleted.');
      if (selectedEntry?.id === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        setSelectedEntry(remaining.length > 0 ? remaining[0] : createNewEntryTemplate(currentUser.uid));
      }
    } catch (error: any) {
      console.error('Delete failed:', error);
      addToast('error', `Failed to delete reflection: ${error.message}`);
    }
  };

  // Toggle pin
  const handleTogglePin = async (entryId: string, currentPin: boolean) => {
    if (!currentUser) return;
    try {
      await togglePinJournalEntry(currentUser.uid, entryId, currentPin);
    } catch (error: any) {
      console.error('Pin toggle failed:', error);
      addToast('error', `Failed to update pin state: ${error.message}`);
    }
  };

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EAE2D5] border border-[#DDD3C2] flex items-center justify-center text-[#8C5E3C] shadow-sm animate-pulse mb-4">
          <Sparkles className="w-7 h-7 text-[#C06014]" />
        </div>
        <p className="text-base font-serif font-bold text-[#1A2826]">Loading ReflectAI...</p>
      </div>
    );
  }

  // Unauthenticated Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage 
          onSignInSuccess={() => {}}
          onError={(msg) => addToast('error', msg)}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Authenticated Dashboard
  const activeEntry = selectedEntry || createNewEntryTemplate(currentUser.uid);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF7F2] overflow-hidden font-sans text-[#1A2826]">
      {/* Top Navbar */}
      <Navbar 
        user={currentUser} 
        onNewEntry={handleNewEntry} 
        onOpenCognitiveRadar={() => setShowCognitiveRadar(true)}
        onOpenAskPastSelf={() => setShowAskPastSelf(true)}
        onOpenBiorythm={() => setShowBiorythm(true)}
        onOpenVaultSettings={() => {
          setVaultModalMode(vaultSettings.isPinEnabled ? 'manage' : 'setup');
          setShowVaultModal(true);
        }}
        vaultSettings={vaultSettings}
        isSaving={isSaving}
      />

      {/* Main Workspace: Sidebar History + Journal Editor */}
      <div className="flex-1 flex overflow-hidden">
        <SidebarHistory
          entries={entries}
          selectedEntryId={activeEntry.id}
          onSelectEntry={handleSelectEntry}
          onNewEntry={handleNewEntry}
          onDeleteEntry={handleDeleteEntry}
          onTogglePin={handleTogglePin}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
        />

        <JournalEditor
          user={currentUser}
          entry={activeEntry}
          onUpdateEntry={handleUpdateEntry}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onError={(msg, onRetry) => addToast('error', msg, onRetry ? 'Retry' : undefined, onRetry)}
          onSuccess={(msg) => addToast('success', msg)}
        />
      </div>

      {/* Cognitive Radar Modal */}
      {showCognitiveRadar && (
        <CognitiveRadarModal
          entries={entries}
          onClose={() => setShowCognitiveRadar(false)}
          onError={(msg) => addToast('error', msg)}
        />
      )}

      {/* Ask Past Self Modal */}
      {showAskPastSelf && (
        <AskPastSelfModal
          isOpen={showAskPastSelf}
          onClose={() => setShowAskPastSelf(false)}
          entries={entries}
          onSelectEntry={(entryId) => {
            const target = entries.find((e) => e.id === entryId);
            if (target) {
              handleSelectEntry(target);
            }
            setShowAskPastSelf(false);
          }}
          onError={(msg) => addToast('error', msg)}
        />
      )}

      {/* Biorythm & Momentum Visualizer Modal */}
      {showBiorythm && (
        <BiorythmVisualizer
          isOpen={showBiorythm}
          onClose={() => setShowBiorythm(false)}
          entries={entries}
        />
      )}

      {/* Vault Pin Modal */}
      {showVaultModal && (
        <VaultPinModal
          isOpen={showVaultModal}
          onClose={() => {
            setShowVaultModal(false);
            setPendingEntryToUnlock(null);
          }}
          mode={vaultModalMode}
          vaultSettings={vaultSettings}
          onUpdateVaultSettings={handleUpdateVaultSettings}
          onUnlockSuccess={() => {
            if (pendingEntryToUnlock) {
              setUnlockedSessionIds((prev) => [...prev, pendingEntryToUnlock.id]);
              setSelectedEntry(pendingEntryToUnlock);
              setPendingEntryToUnlock(null);
            }
            setShowVaultModal(false);
            addToast('success', 'Vault entry unlocked for this session.');
          }}
          onError={(msg) => addToast('error', msg)}
          onSuccess={(msg) => addToast('success', msg)}
        />
      )}

      {/* Global Accessible Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
