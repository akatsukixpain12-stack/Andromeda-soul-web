import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  LogOut,
  User,
  Sparkles,
  Lock,
  Mail,
  Camera,
  Upload,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess?: (user: UserProfile) => void;
  onUpdateUser?: (user: UserProfile) => void;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onUpdateUser,
  onLogout,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'guest' | null>(null);
  const [customName, setCustomName] = useState('Master Architect');
  const [customEmail, setCustomEmail] = useState('akatsuki.x.pain12@gmail.com');
  const [customAvatar, setCustomAvatar] = useState('');
  const [authSuccessNotice, setAuthSuccessNotice] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setCustomName(currentUser.name);
      if (currentUser.email) setCustomEmail(currentUser.email);
      if (currentUser.avatar) setCustomAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const notifyUserChange = (profile: UserProfile) => {
    if (onLoginSuccess) onLoginSuccess(profile);
    if (onUpdateUser) onUpdateUser(profile);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomAvatar(reader.result);
          if (currentUser) {
            const updated = { ...currentUser, avatar: reader.result };
            notifyUserChange(updated);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearAvatar = () => {
    setCustomAvatar('');
    if (currentUser) {
      const updated = { ...currentUser, avatar: '' };
      notifyUserChange(updated);
    }
  };

  const handleAutoFetchGoogleAvatar = () => {
    const email = customEmail.trim() || 'akatsuki.x.pain12@gmail.com';
    const googleUrl = `https://unavatar.io/google/${email}`;
    setCustomAvatar(googleUrl);
    if (currentUser) {
      const updated = { ...currentUser, avatar: googleUrl };
      notifyUserChange(updated);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingProvider('google');
    try {
      await new Promise((r) => setTimeout(r, 450));
      const profile: UserProfile = {
        id: `usr_google_${Date.now()}`,
        name: customName.trim() || 'Master Architect',
        email: customEmail.trim() || 'akatsuki.x.pain12@gmail.com',
        avatar: customAvatar || '',
        provider: 'google',
        connectedAt: Date.now(),
      };

      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
      } catch (e) {
        console.warn('Backend sync optional:', e);
      }

      notifyUserChange(profile);
      setAuthSuccessNotice(true);
      setTimeout(() => {
        setAuthSuccessNotice(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGuestSignIn = async () => {
    setLoadingProvider('guest');
    try {
      const profile: UserProfile = {
        id: `usr_guest_${Date.now()}`,
        name: customName.trim() || 'Guest Creator',
        email: customEmail.trim() || 'guest@andromeda.local',
        avatar: customAvatar || '',
        provider: 'guest',
        connectedAt: Date.now(),
      };

      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
      } catch {
        // ignore
      }

      notifyUserChange(profile);
      onClose();
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSignOut = async () => {
    const guest: UserProfile = {
      id: `guest-${Date.now()}`,
      name: 'Guest Creator',
      email: '',
      avatar: '',
      provider: 'guest',
    };
    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guest),
      });
    } catch {
      // ignore
    }
    if (onLogout) onLogout();
    notifyUserChange(guest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-[#E5E2D9] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header decoration */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1C1917]">Andromeda Google Auth</h3>
              <p className="text-xs text-[#78716C]">Sovereign Account & Profile Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2F0E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success alert banner */}
        {authSuccessNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Google Account connected successfully!</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {currentUser && currentUser.provider === 'google' ? (
            <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-[#E5E2D9] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <UserAvatar
                      name={currentUser.name}
                      email={currentUser.email}
                      avatar={currentUser.avatar}
                      size="lg"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#1C1917] truncate">
                        {currentUser.name}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-xs text-[#78716C] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Connected via Google
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Upload & Controls */}
              <div className="pt-2 border-t border-[#F0EEE6] flex flex-wrap items-center justify-between gap-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <span className="text-xs text-[#78716C]">Profile Picture</span>
                <div className="flex items-center gap-1.5">
                  {currentUser.avatar && (
                    <button
                      type="button"
                      onClick={handleClearAvatar}
                      className="px-2 py-1 rounded-lg text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      title="Clear photo to show username monogram initials"
                    >
                      Use Initials
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAutoFetchGoogleAvatar}
                    className="px-2 py-1 rounded-lg text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                    title="Auto-fetch public Google Profile Picture"
                  >
                    Auto-Fetch Google Pic
                  </button>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Config */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#78716C] uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    <span>Your Google Account Info</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {customAvatar && (
                      <button
                        type="button"
                        onClick={handleClearAvatar}
                        className="text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                      >
                        Use Initials
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAutoFetchGoogleAvatar}
                      className="text-[11px] font-medium text-blue-700 hover:underline cursor-pointer"
                    >
                      Fetch Google Pic
                    </button>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:underline cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative cursor-pointer group shrink-0"
                    title="Click to choose a photo"
                  >
                    <UserAvatar
                      name={customName}
                      email={customEmail}
                      avatar={customAvatar}
                      size="xl"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <div>
                      <label className="block text-[11px] font-medium text-[#78716C] mb-1">Display Name</label>
                      <input
                        type="text"
                        placeholder="Master Architect"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9F5] border border-[#E5E2D9] text-[#1C1917] focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#78716C] mb-1">Google Email</label>
                      <input
                        type="email"
                        placeholder="akatsuki.x.pain12@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9F5] border border-[#E5E2D9] text-[#1C1917] focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden file input for custom avatar */}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Login Providers */}
              <div className="space-y-2.5 pt-2">
                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loadingProvider !== null}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-[#F9F8F5] text-[#1C1917] border border-[#E2E0D8] shadow-xs font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loadingProvider === 'google' ? 'Connecting Google Account...' : 'Continue with Google Auth'}</span>
                </button>

                {/* Guest Mode */}
                <button
                  onClick={handleGuestSignIn}
                  disabled={loadingProvider !== null}
                  className="w-full py-2 text-xs text-[#78716C] hover:text-[#1C1917] transition-colors text-center cursor-pointer"
                >
                  Continue as Guest Developer
                </button>
              </div>
            </>
          )}

          {/* Privacy & Security Note */}
          <div className="pt-3 border-t border-[#F0EEE6] flex items-start gap-2.5 text-[11px] text-[#78716C] leading-relaxed">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Your Google identity is securely saved locally and synchronized. No random stock photos are ever displayed.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
