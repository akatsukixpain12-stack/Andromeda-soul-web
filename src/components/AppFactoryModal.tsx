import React, { useState, useEffect } from 'react';
import {
  X,
  FolderGit2,
  Download,
  Github,
  CheckCircle2,
  AlertCircle,
  Folder,
  FileCode,
  Plus,
  RefreshCw,
  ExternalLink,
  Bot,
  Sparkles,
  ArrowRight,
  Code2,
  Shield,
  Layers,
  Check,
  Search,
} from 'lucide-react';
import JSZip from 'jszip';
import { GeneratedProject, GitHubRepo, GitHubUser } from '../types';

interface AppFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPresetId?: string;
}

export const AppFactoryModal: React.FC<AppFactoryModalProps> = ({
  isOpen,
  onClose,
  initialPresetId,
}) => {
  // Projects & Presets
  const [presets, setPresets] = useState<GeneratedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('pytorch-andromeda');
  const [customFiles, setCustomFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('');
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);

  // GitHub Connection State
  const [githubToken, setGithubToken] = useState('');
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');

  // Push Target Settings
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [targetFolder, setTargetFolder] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isBotPush, setIsBotPush] = useState(true);

  // Push Execution State
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    success?: boolean;
    message?: string;
    repoUrl?: string;
    folderUrl?: string;
    pushedFiles?: string[];
  } | null>(null);

  // Load presets & check existing tokens
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/projects/presets')
      .then((r) => r.json())
      .then((data) => {
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
          const initial = initialPresetId
            ? data.presets.find((p: any) => p.id === initialPresetId) || data.presets[0]
            : data.presets[0];
          if (initial) {
            setSelectedProjectId(initial.id);
            setCustomFiles({ ...initial.files });
            setActiveFile(Object.keys(initial.files)[0] || '');
            setTargetFolder(initial.defaultFolder || '');
          }
        }
      })
      .catch(console.error);

    // Auto-check stored GitHub token
    fetch('/api/github/user')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setGithubUser(data.user);
          loadUserRepos();
        }
      })
      .catch(() => {});
  }, [isOpen, initialPresetId]);

  if (!isOpen) return null;

  const currentProject = presets.find((p) => p.id === selectedProjectId);

  const handleSelectPreset = (p: GeneratedProject) => {
    setSelectedProjectId(p.id);
    setCustomFiles({ ...p.files });
    setActiveFile(Object.keys(p.files)[0] || '');
    setTargetFolder(p.defaultFolder || '');
    setPushStatus(null);
  };

  const loadUserRepos = async (tokenOverride?: string) => {
    setIsLoadingRepos(true);
    try {
      const url = tokenOverride ? `/api/github/repos?token=${encodeURIComponent(tokenOverride)}` : '/api/github/repos';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.repos)) {
        setGithubRepos(data.repos);
        if (data.repos.length > 0 && !selectedRepo) {
          setSelectedRepo(data.repos[0].full_name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleConnectGitHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!githubToken.trim()) return;

    setIsVerifyingGithub(true);
    try {
      const res = await fetch(`/api/github/user?token=${encodeURIComponent(githubToken.trim())}`);
      const data = await res.json();
      if (data.success && data.user) {
        setGithubUser(data.user);
        await loadUserRepos(githubToken.trim());
      } else {
        alert(data.error || 'Failed to authenticate with GitHub token');
      }
    } catch (err: any) {
      alert(err.message || 'Connection error');
    } finally {
      setIsVerifyingGithub(false);
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const files = Object.keys(customFiles).length > 0 ? customFiles : currentProject?.files || {};
    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject?.id || 'andromeda-app'}-bundle.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanPath = newFileName.trim().replace(/^\/+/, '');
    setCustomFiles((prev) => ({
      ...prev,
      [cleanPath]: `// ${cleanPath}\n`,
    }));
    setActiveFile(cleanPath);
    setNewFileName('');
    setShowAddFile(false);
  };

  const handlePushFolder = async () => {
    if (!selectedRepo) {
      alert('Please choose or enter a GitHub repository (e.g. username/repo).');
      return;
    }

    setIsPushing(true);
    setPushStatus(null);

    const files = Object.keys(customFiles).length > 0 ? customFiles : currentProject?.files || {};
    const finalCommitMessage = commitMessage.trim() || (isBotPush
      ? `🤖 Andromeda Soul 1.0: Deploy ${currentProject?.name || 'app'} to ${targetFolder || 'root'}`
      : `Deploy ${currentProject?.name || 'app'} via Andromeda`);

    try {
      const res = await fetch('/api/github/push-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo,
          branch: selectedBranch || 'main',
          targetFolder: targetFolder.trim(),
          files,
          commitMessage: finalCommitMessage,
          githubToken: githubToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPushStatus({
          success: true,
          message: data.message,
          repoUrl: data.repoUrl,
          folderUrl: data.folderUrl,
          pushedFiles: data.pushedFiles,
        });
      } else {
        setPushStatus({
          success: false,
          message: data.error || 'Push failed.',
        });
      }
    } catch (err: any) {
      setPushStatus({
        success: false,
        message: err.message || 'Network error while pushing to GitHub.',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const filteredRepos = githubRepos.filter((r) =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Andromeda App Factory & GitHub Folder Deployer
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Universal App Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate any app, download ZIP, connect GitHub, choose repository and target folder, then deploy seamlessly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Choose or Generate Application */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">
                  1
                </span>
                <span>Select Application Template</span>
              </span>
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Entire Folder (ZIP)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {presets.map((preset) => {
                const isSelected = preset.id === selectedProjectId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {preset.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-File Code Explorer */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
            {/* File tabs */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 overflow-x-auto">
              <div className="flex items-center gap-1">
                {Object.keys(customFiles).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => setActiveFile(fileName)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      activeFile === fileName
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{fileName}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddFile(!showAddFile)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                title="Add new file"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[11px]">New File</span>
              </button>
            </div>

            {showAddFile && (
              <form onSubmit={handleAddFile} className="p-2 bg-slate-900/90 border-b border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. config/options.json"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 px-3 py-1 text-xs rounded bg-slate-800 text-white font-mono outline-hidden border border-slate-700"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                >
                  Create
                </button>
              </form>
            )}

            {/* File code editor */}
            <div className="p-3">
              <textarea
                value={customFiles[activeFile] || ''}
                onChange={(e) =>
                  setCustomFiles((prev) => ({
                    ...prev,
                    [activeFile]: e.target.value,
                  }))
                }
                rows={9}
                className="w-full bg-transparent text-slate-200 font-mono text-xs outline-hidden resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Step 2: Connect GitHub */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">
                  2
                </span>
                <span>Connect GitHub Account</span>
              </span>
              {githubUser && (
                <div className="flex items-center gap-2">
                  <img
                    src={githubUser.avatar_url}
                    alt={githubUser.login}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    @{githubUser.login}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              )}
            </div>

            <form onSubmit={handleConnectGitHub} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder={
                    githubUser
                      ? `Connected as @${githubUser.login} (enter new token to switch)`
                      : 'Paste GitHub Personal Access Token (classic or fine-grained with repo scope)'
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifyingGithub || !githubToken.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isVerifyingGithub ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Github className="w-3.5 h-3.5" />
                )}
                <span>{githubUser ? 'Update Token' : 'Connect'}</span>
              </button>
            </form>
          </div>

          {/* Step 3: Choose Repo, Target Folder, & Push */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>Choose Repository & Target Folder</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Choose Repo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target GitHub Repository (owner/repo)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    placeholder="e.g. username/my-andromeda-app"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-hidden focus:border-emerald-500"
                  />
                  {githubRepos.length > 0 && (
                    <div className="relative">
                      <select
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        value={selectedRepo}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono outline-hidden"
                      >
                        <option value="">Or select from your {githubRepos.length} repos...</option>
                        {githubRepos.map((r) => (
                          <option key={r.id} value={r.full_name}>
                            {r.full_name} {r.private ? '(private)' : '(public)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Folder & Branch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Folder in Repository
                </label>
                <input
                  type="text"
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  placeholder="e.g. / (root) or apps/my-bot or models/pytorch"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-hidden focus:border-emerald-500"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">Quick suggestions:</span>
                  {['/', 'apps/andromeda', 'models/pytorch', 'bot'].map((fld) => (
                    <button
                      key={fld}
                      type="button"
                      onClick={() => setTargetFolder(fld === '/' ? '' : fld)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-mono"
                    >
                      {fld}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commit Message & Bot Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder={`Deploy ${currentProject?.name || 'project'} folder via Andromeda Soul 1.0`}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-4 flex items-center justify-end pt-5">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBotPush}
                    onChange={(e) => setIsBotPush(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-violet-500" />
                    <span>Andromeda Bot Push</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Push Status Banner */}
            {pushStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  pushStatus.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                }`}
              >
                {pushStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{pushStatus.message}</p>
                  {pushStatus.folderUrl && (
                    <a
                      href={pushStatus.folderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline font-mono text-[11px] mt-1"
                    >
                      <span>Open pushed folder on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Final Push Button */}
            <button
              type="button"
              onClick={handlePushFolder}
              disabled={isPushing || !selectedRepo}
              className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all cursor-pointer ${
                isPushing || !selectedRepo
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white hover:scale-[1.008] active:scale-[0.99]'
              }`}
            >
              {isPushing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Committing & Pushing Whole Folder to GitHub...</span>
                </>
              ) : (
                <>
                  <FolderGit2 className="w-4 h-4" />
                  <span>Push Whole Folder to Selected Repository</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
