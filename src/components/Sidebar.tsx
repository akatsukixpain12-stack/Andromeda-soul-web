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
  Sun,
  Moon,
  PanelLeftClose,
  Pin,
  Bot,
  ShieldCheck,
  FolderGit2,
  Users,
  Plug,
} from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  onOpenDiscordBot?: () => void;
  onOpenProjects?: () => void;
  onOpenAgents?: () => void;
  onOpenIntegrations?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  onOpenDiscordBot,
  onOpenProjects,
  onOpenAgents,
  onOpenIntegrations,
  theme,
  onToggleTheme,
  userName,
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

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    // On small screens, automatically collapse sidebar when selecting a conversation
    if (window.innerWidth < 768) {
      onToggleCollapse();
    }
  };

  const handleNewChatAction = () => {
    onNewChat();
    // On small screens, close drawer after creating new chat
    if (window.innerWidth < 768) {
      onToggleCollapse();
    }
  };

  // Group conversations by time
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of filtered) {
      if (c.pinned) {
        pinned.push(c);
        continue;
      }
      const diff = now - c.updatedAt;
      if (diff < oneDay) {
        today.push(c);
      } else if (diff < 2 * oneDay) {
        yesterday.push(c);
      } else if (diff < 7 * oneDay) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    }

    return { pinned, today, yesterday, previous7Days, older };
  }, [conversations, searchQuery]);

  const renderConvItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const isEditing = conv.id === editingId;

    if (isEditing) {
      return (
        <form
          key={conv.id}
          onSubmit={(e) => handleSaveRename(conv.id, e)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 my-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={() => handleSaveRename(conv.id)}
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden"
          />
          <button
            type="submit"
            className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCancelRename}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={conv.id}
        id={`conv-item-${conv.id}`}
        onClick={() => handleSelect(conv.id)}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer min-h-[42px] ${
          isActive
            ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
          <MessageSquare
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? 'text-violet-500' : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          <span className="text-xs truncate block select-none">
            {conv.title || 'New chat'}
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            id={`pin-conv-${conv.id}`}
            type="button"
            title={conv.pinned ? 'Unpin' : 'Pin to top'}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinConversation(conv.id);
            }}
            className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              conv.pinned ? 'text-amber-500 opacity-100' : 'text-slate-400'
            }`}
          >
            <Pin className="w-3 h-3" />
          </button>

          <button
            id={`edit-conv-${conv.id}`}
            type="button"
            title="Rename"
            onClick={(e) => handleStartRename(conv, e)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            id={`delete-conv-${conv.id}`}
            type="button"
            title="Delete conversation"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(conv.id);
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!isCollapsed && (
        <div
          onClick={onToggleCollapse}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="chat-sidebar"
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 h-screen flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out select-none shrink-0 ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:hidden' : 'translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Andromeda</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300">
                  Soul 1
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Uncapped Intelligence
              </p>
            </div>
          </div>
          <button
            id="collapse-sidebar-btn"
            onClick={onToggleCollapse}
            title="Close sidebar"
            className="p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 pb-2">
          <button
            id="new-chat-btn"
            type="button"
            onClick={handleNewChatAction}
            className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xs font-semibold text-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-500" />
              <span>New Chat</span>
            </div>
            <kbd className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              Ctrl+O
            </kbd>
          </button>
        </div>

        {/* Search Input */}
        {conversations.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="search-chats-input"
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-violet-500"
              />
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3 py-1 text-xs">
          {conversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No conversations yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Start chatting with Soul 1</p>
            </div>
          ) : null}

          {/* Pinned */}
          {groupedConversations.pinned.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </div>
              <div className="space-y-0.5">
                {groupedConversations.pinned.map(renderConvItem)}
              </div>
            </div>
          )}

          {/* Today */}
          {groupedConversations.today.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Today
              </div>
              <div className="space-y-0.5">
                {groupedConversations.today.map(renderConvItem)}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedConversations.yesterday.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Yesterday
              </div>
              <div className="space-y-0.5">
                {groupedConversations.yesterday.map(renderConvItem)}
              </div>
            </div>
          )}

          {/* Previous 7 Days */}
          {groupedConversations.previous7Days.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Previous 7 Days
              </div>
              <div className="space-y-0.5">
                {groupedConversations.previous7Days.map(renderConvItem)}
              </div>
            </div>
          )}

          {/* Older */}
          {groupedConversations.older.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Older
              </div>
              <div className="space-y-0.5">
                {groupedConversations.older.map(renderConvItem)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions / Navigation */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1 bg-slate-100/60 dark:bg-slate-900/60">
          {onOpenProjects && (
            <button
              id="sidebar-projects-btn"
              type="button"
              onClick={() => {
                onOpenProjects();
                if (window.innerWidth < 768) onToggleCollapse();
              }}
              className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-4 h-4 text-violet-500" />
                <span>Projects</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Workspace</span>
            </button>
          )}

          {onOpenAgents && (
            <button
              id="sidebar-agents-btn"
              type="button"
              onClick={() => {
                onOpenAgents();
                if (window.innerWidth < 768) onToggleCollapse();
              }}
              className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Agents</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Modes</span>
            </button>
          )}

          {onOpenIntegrations && (
            <button
              id="sidebar-integrations-btn"
              type="button"
              onClick={() => {
                onOpenIntegrations();
                if (window.innerWidth < 768) onToggleCollapse();
              }}
              className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Plug className="w-4 h-4 text-emerald-500" />
                <span>API / Integrations</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                Secure
              </span>
            </button>
          )}

          {onOpenDiscordBot && (
            <button
              id="open-discord-hub-sidebar-btn"
              type="button"
              onClick={() => {
                onOpenDiscordBot();
                if (window.innerWidth < 768) onToggleCollapse();
              }}
              className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-violet-500 group-hover:scale-105 transition-transform" />
                <span>Discord Bot Hub</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-200/60 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                v14
              </span>
            </button>
          )}

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
              {(userName || 'D')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-200 truncate text-[11px] uppercase tracking-wide">
                {userName || 'DIVINE JOHAN'}
              </div>
              <div className="text-[9px] text-zinc-500 font-mono truncate">
                executor developer
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              id="toggle-theme-btn"
              type="button"
              onClick={onToggleTheme}
              className="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="capitalize text-[11px]">{theme}</span>
            </button>

            <button
              id="open-settings-btn"
              type="button"
              onClick={() => {
                onOpenSettings();
                if (window.innerWidth < 768) onToggleCollapse();
              }}
              className="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Settings</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
