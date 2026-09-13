import React, { useState } from 'react';
import {
  X,
  Brain,
  Sparkles,
  Cloud,
  Check,
  Plus,
  Trash2,
  Search,
  Database,
  ShieldCheck,
  BookOpen,
  RefreshCw,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { LearnedKnowledge, UserProfile } from '../types';
import { dbSaveLearnedKnowledge } from '../lib/firebase';

interface LearnedKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeList: LearnedKnowledge[];
  currentUser?: UserProfile | null;
  onAddKnowledge?: (item: LearnedKnowledge) => void;
}

export const LearnedKnowledgeModal: React.FC<LearnedKnowledgeModalProps> = ({
  isOpen,
  onClose,
  knowledgeList,
  currentUser,
  onAddKnowledge,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newInsight, setNewInsight] = useState('');
  const [newCategory, setNewCategory] = useState('coding_style');
  const [newTags, setNewTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredKnowledge = knowledgeList.filter((k) => {
    const matchesQuery =
      k.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.insight.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.tags && k.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'all' || k.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const handleCreateKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newInsight.trim()) return;

    setIsSaving(true);
    const item: LearnedKnowledge = {
      id: `know-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      topic: newTopic.trim(),
      insight: newInsight.trim(),
      category: newCategory,
      source: 'user_taught',
      userId: currentUser?.id || 'usr_local',
      userEmail: currentUser?.email,
      createdAt: Date.now(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (currentUser && currentUser.provider !== 'guest') {
      await dbSaveLearnedKnowledge(currentUser.id, item);
    }
    if (onAddKnowledge) {
      onAddKnowledge(item);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setNewTopic('');
    setNewInsight('');
    setNewTags('');
    setTimeout(() => {
      setSaveSuccess(false);
      setShowAddForm(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90dvh] bg-[#FAF9F5] dark:bg-[#0f1117] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="h-14 bg-white dark:bg-[#141824] border-b border-[#E2E0D8] dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm font-display text-slate-900 dark:text-white">
                  Google Cloud Learned Memory & Knowledge
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Google Cloud Server
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Insights, rules, and concepts taught by users stored securely in Google Cloud Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white/50 dark:bg-[#141824]/50 border-b border-[#E2E0D8] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learned memory & rules..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E0D8] dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E0D8] dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="coding_style">Coding Patterns</option>
              <option value="discord_bot">Discord Bot Logic</option>
              <option value="user_preference">User Preferences</option>
              <option value="general_intelligence">General Knowledge</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Teach Andromeda</span>
          </button>
        </div>

        {/* Add Knowledge Form (collapsible) */}
        {showAddForm && (
          <form
            onSubmit={handleCreateKnowledge}
            className="p-4 bg-amber-500/5 border-b border-amber-500/20 space-y-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-400 font-mono">
                🧠 Teach Andromeda a New Skill or Rule
              </span>
              <span className="text-[11px] text-slate-500">Auto-synced to Google Cloud server</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Concept
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Discord.js v14 Slash Commands"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E0D8] dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E0D8] dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="coding_style">Coding Patterns & Frameworks</option>
                  <option value="discord_bot">Discord Bot & Gateway</option>
                  <option value="user_preference">Personal Tone / Formatting</option>
                  <option value="general_intelligence">Domain Knowledge</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                Instruction / Learned Insight (What should Andromeda remember?)
              </label>
              <textarea
                value={newInsight}
                onChange={(e) => setNewInsight(e.target.value)}
                placeholder="e.g. Always write Discord bots using Discord.js v14 with GatewayIntentBits and SlashCommandBuilder syntax."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E0D8] dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma-separated, e.g. discord, typescript, bot)"
                className="flex-1 max-w-sm px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E0D8] dark:border-slate-700 text-xs text-slate-900 dark:text-white mr-2 focus:outline-hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved to Cloud!' : 'Save Knowledge'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Knowledge List Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredKnowledge.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-slate-500">
              <Database className="w-10 h-10 mx-auto text-amber-500/50" />
              <div>
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  No learned knowledge records found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click "Teach Andromeda" above or chat with Andromeda to create cloud memories!
                </p>
              </div>
            </div>
          ) : (
            filteredKnowledge.map((k) => (
              <div
                key={k.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#141824] border border-[#E2E0D8] dark:border-slate-800 hover:border-amber-500/40 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">{k.topic}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {k.category || 'general'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {k.insight}
                </p>

                {k.tags && k.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {k.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-mono"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-white dark:bg-[#141824] border-t border-[#E2E0D8] dark:border-slate-800 px-4 flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Google Cloud Partition: users/{currentUser?.id || 'session'}</span>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            {filteredKnowledge.length} item(s) active in intelligence loop
          </span>
        </div>
      </div>
    </div>
  );
};
