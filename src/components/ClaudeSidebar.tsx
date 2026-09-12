import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Settings,
  Pin,
  Sparkles,
  Sliders,
  Cpu,
  HardDrive,
  Flame,
  CheckCircle2,
  ExternalLink,
  Shield,
  User,
  LogOut,
} from 'lucide-react';
import { Conversation, UserSettings, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';

interface ClaudeSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenProviders: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
  settings: UserSettings;
}

export const ClaudeSidebar: React.FC<ClaudeSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenProviders,
  onOpenAuth,
  currentUser,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(null);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const pinnedConversations = useMemo(() => {
    return filteredConversations.filter((c) => c.pinned);
  }, [filteredConversations]);

  const unpinnedConversations = useMemo(() => {
    return filteredConversations.filter((c) => !c.pinned);
  }, [filteredConversations]);

  // Group by date
  const groupedConversations = useMemo(() => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    unpinnedConversations.forEach((conv) => {
      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < 2 * oneDay) {
        yesterday.push(conv);
      } else if (diff < 7 * oneDay) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, last7Days, older };
  }, [unpinnedConversations]);

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const isEditing = conv.id === editingId;

    return (
      <div
        key={conv.id}
        id={`conversation-item-${conv.id}`}
        onClick={() => {
          onSelectConversation(conv.id);
          if (window.innerWidth < 768) onCloseMobile();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
          isActive
            ? 'bg-[#F2EFE9] text-[#1C1917] font-semibold shadow-2xs'
            : 'text-[#44403C] hover:bg-[#F5F3ED] hover:text-[#1C1917]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-[#D97706]' : 'text-[#8C887B] group-hover:text-[#44403C]'
            }`}
          />

          {isEditing ? (
            <form
              onSubmit={(e) => handleSaveRename(conv.id, e)}
              className="flex-1 flex items-center gap-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                id={`rename-input-${conv.id}`}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                autoFocus
                className="w-full text-xs font-medium px-2 py-1 bg-white border border-[#D97706] rounded-md outline-none text-[#1C1917]"
              />
              <button
                type="submit"
                className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate flex-1">{conv.title}</span>
          )}
        </div>

        {/* Action icons on hover */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pl-1 transition-opacity">
            <button
              id={`pin-chat-${conv.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinConversation(conv.id);
              }}
              className={`p-1 rounded-md hover:bg-[#EAE7DE] text-[#78716C] transition-colors cursor-pointer ${
                conv.pinned ? 'text-[#D97706]' : ''
              }`}
              title={conv.pinned ? 'Unpin' : 'Pin conversation'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              id={`rename-chat-${conv.id}`}
              onClick={(e) => handleStartRename(conv, e)}
              className="p-1 rounded-md hover:bg-[#EAE7DE] text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
              title="Rename"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`delete-chat-${conv.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="p-1 rounded-md hover:bg-rose-50 text-[#78716C] hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs md:hidden"
        />
      )}

      <aside
        id="claude-sidebar"
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-[#FBFBFA] border-r border-[#EAE8E2] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none'
        }`}
      >
        {/* Top Header: Logo + New Chat */}
        <div className="p-3.5 border-b border-[#F0EEE6] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                A
              </div>
              <div className="leading-tight">
                <span className="font-bold text-sm text-[#1C1917] tracking-tight block">Andromeda</span>
                <span className="text-[11px] text-[#78716C] font-medium block">Sovereign AI Studio</span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            id="sidebar-new-chat-button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-[#F7F6F0] border border-[#E2E0D8] text-sm font-semibold text-[#1C1917] shadow-2xs hover:border-[#D0CDC4] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>New Chat</span>
          </button>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[#8C887B]" />
            <input
              id="search-chats-input"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E3DB] rounded-xl text-[#1C1917] placeholder-[#8C887B] focus:border-[#D97706] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8C887B] uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3 text-[#D97706]" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {pinnedConversations.map(renderConversationItem)}
              </div>
            </div>
          )}

          {groupedConversations.today.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8C887B] uppercase tracking-wider">
                Today
              </div>
              <div className="space-y-0.5 mt-1">
                {groupedConversations.today.map(renderConversationItem)}
              </div>
            </div>
          )}

          {groupedConversations.yesterday.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8C887B] uppercase tracking-wider">
                Yesterday
              </div>
              <div className="space-y-0.5 mt-1">
                {groupedConversations.yesterday.map(renderConversationItem)}
              </div>
            </div>
          )}

          {groupedConversations.last7Days.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8C887B] uppercase tracking-wider">
                Previous 7 Days
              </div>
              <div className="space-y-0.5 mt-1">
                {groupedConversations.last7Days.map(renderConversationItem)}
              </div>
            </div>
          )}

          {groupedConversations.older.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8C887B] uppercase tracking-wider">
                Older
              </div>
              <div className="space-y-0.5 mt-1">
                {groupedConversations.older.map(renderConversationItem)}
              </div>
            </div>
          )}

          {conversations.length === 0 && (
            <div className="text-center py-10 px-4 text-[#8C887B] text-xs">
              No conversations yet. Start a new chat above!
            </div>
          )}
        </div>

        {/* Free Provider Status Mini-Cards */}
        <div className="p-3 border-t border-[#F0EEE6] bg-[#F7F6F1]/60 space-y-2">
          <div className="text-[11px] font-semibold text-[#8C887B] uppercase tracking-wider flex items-center justify-between">
            <span>Free Providers Ready</span>
            <button
              onClick={onOpenProviders}
              className="text-[#D97706] hover:underline cursor-pointer"
            >
              Setup
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded-lg bg-white border border-[#E5E3DB] flex items-center gap-1.5 text-[#292524]">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Gemini API</span>
                <span className="text-[10px] text-emerald-600 block">Free Tier</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-white border border-[#E5E3DB] flex items-center gap-1.5 text-[#292524]">
              <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Ollama Local</span>
                <span className="text-[10px] text-emerald-600 block">:11434</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-white border border-[#E5E3DB] flex items-center gap-1.5 text-[#292524]">
              <HardDrive className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">LM Studio</span>
                <span className="text-[10px] text-emerald-600 block">:1234</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-white border border-[#E5E3DB] flex items-center gap-1.5 text-[#292524]">
              <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block truncate">Claude Style</span>
                <span className="text-[10px] text-amber-600 block">Thinking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Bar & Google Auth */}
        <div className="p-3 border-t border-[#F0EEE6] flex items-center justify-between gap-2">
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 min-w-0 text-left hover:bg-[#F0EEE6] p-1.5 -ml-1.5 rounded-xl transition-colors flex-1 cursor-pointer"
            title={currentUser && currentUser.provider !== 'guest' ? 'Manage Account' : 'Sign in with Google'}
          >
            <UserAvatar
              name={currentUser?.name || settings.userName}
              email={currentUser?.email || settings.userEmail}
              avatar={currentUser?.avatar || settings.userAvatar}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#1C1917] block truncate">
                  {currentUser?.name || settings.userName || 'Creator'}
                </span>
                {currentUser && currentUser.provider === 'google' && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-[#78716C] block truncate">
                {currentUser?.email || (currentUser?.provider === 'google' ? 'Google Account' : 'Google Auth / Profile')}
              </span>
            </div>
          </button>

          <button
            id="sidebar-open-settings"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F0EEE6] transition-colors cursor-pointer shrink-0"
            title="Settings & Providers"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
