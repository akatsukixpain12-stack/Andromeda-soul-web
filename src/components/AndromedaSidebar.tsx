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
  Terminal,
  Flame,
  CheckCircle2,
  ExternalLink,
  Shield,
  User,
  LogOut,
} from 'lucide-react';
import { Conversation, UserSettings, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';

interface AndromedaSidebarProps {
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
  onOpenKnowledgeModal?: () => void;
  knowledgeCount?: number;
  onOpenMediaEngine?: () => void;
  onOpenTerminal?: () => void;
  onOpenDiscord?: () => void;
  currentUser?: UserProfile | null;
  settings: UserSettings;
}

export const AndromedaSidebar: React.FC<AndromedaSidebarProps> = ({
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
  onOpenKnowledgeModal,
  knowledgeCount = 0,
  onOpenMediaEngine,
  onOpenTerminal,
  onOpenDiscord,
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

        {/* Action icons */}
        {!isEditing && (
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 pl-1 transition-opacity">
            <button
              id={`pin-chat-${conv.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinConversation(conv.id);
              }}
              className={`p-1.5 md:p-1 rounded-md hover:bg-[#EAE7DE] text-[#78716C] transition-colors cursor-pointer ${
                conv.pinned ? 'text-[#D97706]' : ''
              }`}
              title={conv.pinned ? 'Unpin' : 'Pin conversation'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              id={`rename-chat-${conv.id}`}
              onClick={(e) => handleStartRename(conv, e)}
              className="p-1.5 md:p-1 rounded-md hover:bg-[#EAE7DE] text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
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
              className="p-1.5 md:p-1 rounded-md hover:bg-rose-50 text-[#78716C] hover:text-rose-600 transition-colors cursor-pointer"
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs md:hidden"
        />
      )}

      <aside
        id="andromeda-sidebar"
        className={`fixed md:sticky top-0 left-0 z-40 h-[100dvh] w-72 max-w-[85vw] bg-[#FBFBFA] border-r border-[#EAE8E2] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none'
        }`}
      >
        {/* Top Header: Logo + New Chat */}
        <div className="p-3.5 border-b border-[#F0EEE6] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/andromeda-logo.png"
                alt="Andromeda Soul Logo"
                className="w-8 h-8 rounded-xl object-cover shadow-xs border border-blue-200/50"
                referrerPolicy="no-referrer"
              />
              <div className="leading-tight">
                <span className="font-bold text-sm text-[#1C1917] tracking-tight block">Andromeda Soul</span>
                <span className="text-[11px] text-[#78716C] font-medium block">Think • Code • Create</span>
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

          {/* Quantum Utility Tools Row */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                onOpenMediaEngine?.();
                if (window.innerWidth < 768) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1 px-1.5 py-1.5 text-[10px] font-bold rounded-xl bg-white hover:bg-[#F7F6F0] border border-[#E2E0D8] text-[#1C1917] hover:border-[#D0CDC4] transition-all cursor-pointer truncate"
              title="Creative Picture & Video Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Media</span>
            </button>
            <button
              onClick={() => {
                onOpenTerminal?.();
                if (window.innerWidth < 768) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1 px-1.5 py-1.5 text-[10px] font-bold rounded-xl bg-white hover:bg-[#F7F6F0] border border-[#E2E0D8] text-[#1C1917] hover:border-[#D0CDC4] transition-all cursor-pointer truncate"
              title="Built-in Bash Shell Terminal"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Shell</span>
            </button>
            <button
              onClick={() => {
                onOpenDiscord?.();
                if (window.innerWidth < 768) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1 px-1.5 py-1.5 text-[10px] font-bold rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:border-[#5865F2]/50 transition-all cursor-pointer truncate"
              title="Discord Bot & Autonomous Code Gateway (/discord)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#5865F2] shrink-0" />
              <span>Discord</span>
            </button>
          </div>

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
                <span className="font-semibold block truncate">Andromeda Style</span>
                <span className="text-[10px] text-amber-600 block">Thinking</span>
              </div>
            </div>
          </div>

          {/* Google Cloud Server Persistence & Memory Status */}
          <button
            onClick={onOpenKnowledgeModal}
            className="mt-2.5 w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80 hover:bg-emerald-100/80 transition-colors text-left cursor-pointer group"
            title="Google Cloud Firestore: All chats & autonomous learned memory are permanently synced. Click to view memory."
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="truncate">
                <span className="text-[11px] font-semibold text-emerald-950 block truncate">
                  Google Cloud Server
                </span>
                <span className="text-[10px] text-emerald-700 block truncate font-mono">
                  {knowledgeCount > 0 ? `${knowledgeCount} Memories Auto-Learned` : 'Firestore Connected'}
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-mono px-1.5 py-0.5 rounded-md shrink-0">
              Cloud
            </span>
          </button>
        </div>

        {/* Bottom User Bar & Google Auth */}
        <div className="p-3 border-t border-[#F0EEE6] flex items-center justify-between gap-2">
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 min-w-0 text-left hover:bg-[#F0EEE6] p-1.5 -ml-1.5 rounded-xl transition-colors flex-1 cursor-pointer"
            title={currentUser && currentUser.provider !== 'guest' ? 'Manage Account' : 'Sign in with Google'}
          >
            <UserAvatar
              name={currentUser?.name || 'Guest Creator'}
              email={currentUser?.email || ''}
              avatar={currentUser?.avatar || ''}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#1C1917] block truncate">
                  {currentUser?.name || 'Guest Creator'}
                </span>
                {currentUser && currentUser.provider === 'google' && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-[#78716C] block truncate">
                {currentUser?.email || (currentUser?.provider === 'google' ? 'Google Account' : 'Guest Mode')}
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
