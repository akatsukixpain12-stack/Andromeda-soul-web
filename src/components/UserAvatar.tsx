import React, { useState } from 'react';
import { UserProfile } from '../types';

interface UserAvatarProps {
  user?: UserProfile | null;
  name?: string;
  email?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  email,
  avatar,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const effectiveName = user?.name || name || 'Creator';
  const effectiveEmail = user?.email || email || '';
  const effectiveAvatar = user?.avatar || avatar || '';
  const [imageError, setImageError] = useState(false);

  // Derive initial from username or email
  const getInitials = () => {
    const cleanName = (effectiveName || '').trim();
    if (cleanName && cleanName !== 'User' && cleanName !== 'Creator') {
      const parts = cleanName.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return cleanName.slice(0, 2).toUpperCase();
    }
    if (effectiveEmail && effectiveEmail.trim()) {
      const userPart = effectiveEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      if (userPart.length >= 2) {
        return userPart.slice(0, 2).toUpperCase();
      }
      return userPart.slice(0, 1).toUpperCase() || 'A';
    }
    return cleanName ? cleanName.slice(0, 2).toUpperCase() : 'A';
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-14 h-14 text-base font-bold',
  }[size];

  // Try to use Google avatar or explicit avatar URL if provided and not errored
  const avatarUrl = effectiveAvatar && !imageError && effectiveAvatar.trim() !== '' ? effectiveAvatar.trim() : null;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={effectiveName || 'User Profile'}
        onError={() => setImageError(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 ${
          showBorder ? 'border border-amber-500/30' : ''
        } ${className}`}
      />
    );
  }

  // If no picture or picture not available, show username initial badge
  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#1C1917] via-[#292524] to-[#451a03] text-amber-400 flex items-center justify-center font-bold tracking-tight shrink-0 select-none shadow-xs ${
        showBorder ? 'border border-amber-500/40' : ''
      } ${className}`}
      title={effectiveName ? `${effectiveName} (${effectiveEmail})` : effectiveEmail}
    >
      {getInitials()}
    </div>
  );
};
