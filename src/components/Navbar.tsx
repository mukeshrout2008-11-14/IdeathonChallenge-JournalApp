import React from 'react';
import { 
  Sparkles, 
  Plus, 
  LogOut, 
  Shield, 
  User as UserIcon,
  CheckCircle2,
  Compass,
  History,
  Activity,
  Lock,
  Unlock
} from 'lucide-react';
import { AppUser, VaultSettings } from '../types';
import { signOutUser } from '../lib/firebase';

interface NavbarProps {
  user: AppUser;
  onNewEntry: () => void;
  onOpenCognitiveRadar: () => void;
  onOpenAskPastSelf: () => void;
  onOpenBiorythm: () => void;
  onOpenVaultSettings: () => void;
  vaultSettings: VaultSettings;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onNewEntry, 
  onOpenCognitiveRadar,
  onOpenAskPastSelf,
  onOpenBiorythm,
  onOpenVaultSettings,
  vaultSettings,
  isSaving = false 
}) => {
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="h-16 border-b border-[#EAE4DC] bg-[#FAF7F2]/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between">
      {/* Brand & Sync Status */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2D4A43] to-[#40695E] flex items-center justify-center text-[#FDFBF7] shadow-sm border border-[#2D4A43]/20 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[#E6C994]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#1A2826] tracking-tight">ReflectAI</span>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium bg-[#EAE2D5] text-[#4A3B32] border border-[#DCD3C4]">
              <Shield className="w-3 h-3 mr-1 text-[#8C5E3C]" /> Isolated DB
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-[#737C78]">
            {isSaving ? (
              <span className="flex items-center text-[#C06014]">
                <span className="w-2 h-2 rounded-full bg-[#C06014] animate-pulse mr-1" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center text-[#2D4A43]">
                <CheckCircle2 className="w-3 h-3 mr-1 text-[#3D5A4C]" />
                Synced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center / Action Buttons */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Ask Past Self Button */}
        <button
          id="nav-ask-past-self-btn"
          onClick={onOpenAskPastSelf}
          className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold rounded-lg bg-[#FFFFFF] hover:bg-[#F0EBE1] text-[#8C5E3C] shadow-2xs transition-all border border-[#D5C9B8]"
          title="Search & Query Your Past Reflections"
        >
          <History className="w-3.5 h-3.5 text-[#8C5E3C]" />
          <span className="hidden md:inline">Past Self</span>
        </button>

        {/* Biorythm & Momentum Visualizer */}
        <button
          id="nav-biorythm-btn"
          onClick={onOpenBiorythm}
          className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold rounded-lg bg-[#FFFFFF] hover:bg-[#F0EBE1] text-[#2D4A43] shadow-2xs transition-all border border-[#D5C9B8]"
          title="Daily Momentum & Emotional Rhythm"
        >
          <Activity className="w-3.5 h-3.5 text-[#2D4A43]" />
          <span className="hidden md:inline">Biorythm</span>
        </button>

        {/* Cognitive Radar Button */}
        <button
          id="nav-radar-btn"
          onClick={onOpenCognitiveRadar}
          className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold rounded-lg bg-[#EAE2D5] hover:bg-[#DDD3C2] text-[#4A3B32] shadow-2xs transition-all border border-[#D5C9B8]"
          title="Analyze Blind Spots & Growth Radar"
        >
          <Compass className="w-3.5 h-3.5 text-[#8C5E3C]" />
          <span className="hidden sm:inline">Radar</span>
        </button>

        {/* Private Vault Button */}
        <button
          id="nav-vault-btn"
          onClick={onOpenVaultSettings}
          className={`inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold rounded-lg shadow-2xs transition-all border ${
            vaultSettings.isPinEnabled
              ? 'bg-[#2D4A43] text-[#FAF7F2] border-[#2D4A43]'
              : 'bg-[#FFFFFF] text-[#737C78] hover:text-[#182624] border-[#D5C9B8]'
          }`}
          title={vaultSettings.isPinEnabled ? 'Vault Active' : 'Configure PIN Vault'}
        >
          {vaultSettings.isPinEnabled ? (
            <Lock className="w-3.5 h-3.5 text-[#E6C994]" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
          <span className="hidden lg:inline">Vault</span>
        </button>

        {/* New Reflection Button */}
        <button
          id="nav-new-entry-btn"
          onClick={onNewEntry}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-sans font-semibold rounded-lg bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] shadow-sm transition-all border border-[#233A34]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </button>

        {/* User Profile & Sign Out */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-[#EAE4DC]">
          <div className="flex items-center space-x-2">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#DCD3C4] object-cover"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EAE2D5] border border-[#DCD3C4] flex items-center justify-center text-[#4A3B32]">
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            )}
          </div>

          <button
            id="nav-sign-out-btn"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-[#737C78] hover:text-[#9C4124] hover:bg-[#F3ECE6] rounded-lg transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
