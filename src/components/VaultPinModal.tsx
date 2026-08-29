import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { VaultSettings } from '../types';

interface VaultPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultSettings: VaultSettings;
  onUpdateVaultSettings: (settings: VaultSettings) => void;
  onUnlockSuccess?: () => void;
  mode: 'setup' | 'unlock' | 'manage';
  entryIdToLockUnlock?: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const VaultPinModal: React.FC<VaultPinModalProps> = ({
  isOpen,
  onClose,
  vaultSettings,
  onUpdateVaultSettings,
  onUnlockSuccess,
  mode,
  entryIdToLockUnlock,
  onError,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (pin.length < 4) {
      setErrorText('PIN must be at least 4 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setErrorText('PINs do not match. Please re-enter.');
      return;
    }

    // In client storage, store base64 representation of PIN for basic private local vault guarding
    const pinHash = btoa(`reflect_vault_${pin}`);
    const newSettings: VaultSettings = {
      ...vaultSettings,
      isPinEnabled: true,
      pinHash,
      lockedEntryIds: entryIdToLockUnlock && !vaultSettings.lockedEntryIds.includes(entryIdToLockUnlock)
        ? [...vaultSettings.lockedEntryIds, entryIdToLockUnlock]
        : vaultSettings.lockedEntryIds,
    };

    onUpdateVaultSettings(newSettings);
    onSuccess('Vault PIN successfully activated.');
    if (onUnlockSuccess) onUnlockSuccess();
    onClose();
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const enteredHash = btoa(`reflect_vault_${pin}`);
    if (enteredHash === vaultSettings.pinHash) {
      onSuccess('Vault unlocked.');
      if (onUnlockSuccess) onUnlockSuccess();
      onClose();
    } else {
      setErrorText('Incorrect PIN. Please try again.');
      onError('Incorrect PIN.');
    }
  };

  const handleToggleLockCurrentEntry = () => {
    if (!entryIdToLockUnlock) return;
    const isLocked = vaultSettings.lockedEntryIds.includes(entryIdToLockUnlock);
    const updatedLocked = isLocked
      ? vaultSettings.lockedEntryIds.filter(id => id !== entryIdToLockUnlock)
      : [...vaultSettings.lockedEntryIds, entryIdToLockUnlock];

    const newSettings: VaultSettings = {
      ...vaultSettings,
      lockedEntryIds: updatedLocked,
    };

    onUpdateVaultSettings(newSettings);
    onSuccess(isLocked ? 'Entry removed from Private Vault.' : 'Entry locked in Private Vault.');
    onClose();
  };

  const handleDisablePin = () => {
    const enteredHash = btoa(`reflect_vault_${pin}`);
    if (enteredHash !== vaultSettings.pinHash) {
      setErrorText('Please enter your current PIN to disable the Vault.');
      return;
    }

    const newSettings: VaultSettings = {
      isPinEnabled: false,
      pinHash: undefined,
      lockedEntryIds: [],
    };

    onUpdateVaultSettings(newSettings);
    onSuccess('Vault PIN disabled.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#182624]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4DC] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4A43] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#182624]">
                {mode === 'unlock' ? 'Unlock Private Vault' : 'Private Vault Settings'}
              </h2>
              <p className="text-xs text-[#737C78]">Secure sensitive reflections with client-side PIN protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#737C78] hover:text-[#182624] p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorText && (
          <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#F5D5D0] text-[#9C4124] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Mode: Unlock */}
        {mode === 'unlock' && (
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">Enter Vault PIN</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={8}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-8 digit PIN"
                  className="w-full text-center text-lg tracking-widest font-mono py-2.5 bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A69D92] hover:text-[#4A3B32]"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-2.5 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] text-xs font-bold shadow-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Vault</span>
            </button>
          </form>
        )}

        {/* Mode: Setup */}
        {mode === 'setup' && (
          <form onSubmit={handleSetupPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">Choose 4-8 Digit PIN</label>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 2486"
                className="w-full text-center text-base tracking-widest font-mono py-2 bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">Confirm PIN</label>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Re-type PIN"
                className="w-full text-center text-base tracking-widest font-mono py-2 bg-[#FFFFFF] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-[#737C78] hover:text-[#182624] flex items-center space-x-1"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={pin.length < 4 || confirmPin.length < 4}
              className="w-full py-2.5 rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] text-xs font-bold shadow-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Activate Vault Protection</span>
            </button>
          </form>
        )}

        {/* Mode: Manage */}
        {mode === 'manage' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#182624]">Vault Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5ECE9] text-[#2D4A43] font-bold text-[10px]">
                  PIN Active ({vaultSettings.lockedEntryIds.length} Protected Entries)
                </span>
              </div>
              <p className="text-[#737C78] leading-relaxed">
                Locked reflections require PIN verification before content is rendered on screen.
              </p>
            </div>

            {entryIdToLockUnlock && (
              <button
                type="button"
                onClick={handleToggleLockCurrentEntry}
                className="w-full py-2.5 rounded-xl border border-[#DCD3C4] bg-[#FAF8F5] hover:bg-[#FFFFFF] text-xs font-bold text-[#4A3B32] transition-colors flex items-center justify-center space-x-2"
              >
                {vaultSettings.lockedEntryIds.includes(entryIdToLockUnlock) ? (
                  <>
                    <Unlock className="w-4 h-4 text-[#8C5E3C]" />
                    <span>Unlock Current Entry</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#2D4A43]" />
                    <span>Lock Current Entry in Vault</span>
                  </>
                )}
              </button>
            )}

            {/* Disable Vault option */}
            <div className="pt-3 border-t border-[#EAE4DC] space-y-2">
              <label className="block text-[11px] font-semibold text-[#737C78]">To Disable Vault, verify PIN:</label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter current PIN"
                className="w-full text-center text-xs font-mono py-1.5 bg-[#FFFFFF] border border-[#DCD3C4] rounded-lg focus:outline-none"
              />
              <button
                type="button"
                onClick={handleDisablePin}
                disabled={pin.length < 4}
                className="w-full py-2 rounded-lg bg-[#FAF0ED] hover:bg-[#FBE4DE] text-[#9C4124] text-xs font-bold disabled:opacity-50 transition-colors"
              >
                Disable Vault &amp; Remove PIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
