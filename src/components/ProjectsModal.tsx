import React, { useState, useEffect } from 'react';
import {
  X,
  FolderGit2,
  Folder,
  FileCode,
  Plus,
  Download,
  Trash2,
  Save,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Code2,
  Github,
  Check,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { Project } from '../types';
import { scanFilesForSecrets, SecretFinding } from '../lib/secretScanner';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatInProject: (project: Project) => void;
  activeProjectId?: string | null;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  onChatInProject,
  activeProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Full Stack');
  const [newProjectInstructions, setNewProjectInstructions] = useState('');
  
  // New File modal state
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Status message
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [secretFindings, setSecretFindings] = useState<SecretFinding[]>([]);

  // Load projects
  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          const target = activeProjectId
            ? data.find((p: Project) => p.id === activeProjectId) || data[0]
            : data[0];
          setSelectedProjectId(target.id);
          const firstFile = Object.keys(target.files)[0] || '';
          setSelectedFile(firstFile);
          setFileContent(target.files[firstFile] || '');
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Sync file content when current project or selected file changes
  useEffect(() => {
    if (currentProject && selectedFile && currentProject.files[selectedFile] !== undefined) {
      setFileContent(currentProject.files[selectedFile]);
      setIsEditingFile(false);
    } else if (currentProject) {
      const files = Object.keys(currentProject.files);
      if (files.length > 0) {
        setSelectedFile(files[0]);
        setFileContent(currentProject.files[files[0]]);
      } else {
        setSelectedFile('');
        setFileContent('');
      }
    }
  }, [selectedProjectId, selectedFile]);

  if (!isOpen) return null;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom Andromeda project',
      category: newProjectCategory,
      instructions: newProjectInstructions.trim() || 'Operate inside this project workspace.',
      files: {
        'README.md': `# ${newProjectName}\n\nProject created in Andromeda Soul 1.0.\n`,
        '.gitignore': 'node_modules/\n.env\n*.key\n',
        '.env.example': '# Environment template\n',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProj),
      });
      if (res.ok) {
        const saved = await res.json();
        setProjects((prev) => [saved, ...prev]);
        setSelectedProjectId(saved.id);
        setSelectedFile('README.md');
        setFileContent(saved.files['README.md']);
        setIsCreatingProject(false);
        setNewProjectName('');
        setNewProjectDesc('');
        setNewProjectInstructions('');
        setStatusNotice({ type: 'success', message: 'Project initialized successfully!' });
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setStatusNotice({ type: 'error', message: 'Failed to create project.' });
    }
  };

  const handleSaveFileContent = async () => {
    if (!currentProject || !selectedFile) return;

    // Scan file before saving
    const scan = scanFilesForSecrets({ [selectedFile]: fileContent });
    if (scan.hasSecrets) {
      setSecretFindings(scan.findings);
      setStatusNotice({
        type: 'error',
        message: 'Potential secret detected. Remove sensitive token before saving.',
      });
      return;
    }

    setSecretFindings([]);
    const updatedFiles = { ...currentProject.files, [selectedFile]: fileContent };
    const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: Date.now() };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
        setIsEditingFile(false);
        setStatusNotice({ type: 'success', message: `Saved ${selectedFile}` });
        setTimeout(() => setStatusNotice(null), 2500);
      }
    } catch (err) {
      console.error(err);
      setStatusNotice({ type: 'error', message: 'Failed to save file.' });
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newFileName.trim()) return;

    const cleanName = newFileName.trim().replace(/^\/+/, '');
    if (currentProject.files[cleanName]) {
      setStatusNotice({ type: 'error', message: 'File already exists.' });
      return;
    }

    const updatedFiles = { ...currentProject.files, [cleanName]: `// ${cleanName}\n` };
    const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: Date.now() };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
        setSelectedFile(cleanName);
        setFileContent(`// ${cleanName}\n`);
        setShowAddFile(false);
        setNewFileName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!currentProject) return;
    if (Object.keys(currentProject.files).length <= 1) {
      setStatusNotice({ type: 'error', message: 'A project must keep at least one file.' });
      return;
    }

    const updatedFiles = { ...currentProject.files };
    delete updatedFiles[filename];
    const remaining = Object.keys(updatedFiles);
    const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: Date.now() };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
        setSelectedFile(remaining[0] || '');
        setFileContent(updatedFiles[remaining[0]] || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadZip = async () => {
    if (!currentProject) return;

    // Scan for secrets before packing
    const scan = scanFilesForSecrets(currentProject.files);
    if (scan.hasSecrets) {
      setSecretFindings(scan.findings);
      setStatusNotice({
        type: 'error',
        message: 'Potential secret detected in project files. Export blocked until resolved.',
      });
      return;
    }

    const zip = new JSZip();
    for (const [filename, content] of Object.entries(currentProject.files)) {
      zip.file(filename, content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      if (remaining.length > 0) {
        setSelectedProjectId(remaining[0].id);
      } else {
        setSelectedProjectId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[760px]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Projects
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {projects.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage multi-file workspaces and associate them with Andromeda Soul 1.0.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="new-project-btn"
              type="button"
              onClick={() => setIsCreatingProject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <button
              id="close-projects-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusNotice && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              statusNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {statusNotice.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{statusNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Layout: Left Projects List, Right Project Details & Files */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Projects Column */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/30 overflow-y-auto shrink-0 p-2 space-y-1">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No projects yet. Click "+ New Project" above.
              </div>
            ) : (
              projects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                const isCurrentlyActiveInChat = p.id === activeProjectId;
                const fileCount = Object.keys(p.files || {}).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      const fnames = Object.keys(p.files);
                      setSelectedFile(fnames[0] || '');
                    }}
                    className={`p-2.5 rounded-2xl cursor-pointer text-left transition-all border ${
                      isSelected
                        ? 'bg-violet-500/10 border-violet-500/30 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs truncate max-w-[140px]">{p.name}</span>
                      {isCurrentlyActiveInChat && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1.5">
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{p.category}</span>
                      <span>{fileCount} files</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Project Details / Files Workspace */}
          {currentProject ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              {/* Workspace Top Bar */}
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentProject.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold">
                      {currentProject.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {currentProject.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="chat-in-project-btn"
                    type="button"
                    onClick={() => {
                      onChatInProject(currentProject);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat in this Project</span>
                  </button>

                  <button
                    id="download-project-zip-btn"
                    type="button"
                    onClick={handleDownloadZip}
                    title="Export as ZIP"
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs transition-colors cursor-pointer flex items-center gap-1 px-2.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ZIP</span>
                  </button>

                  <button
                    id="delete-project-btn"
                    type="button"
                    onClick={() => handleDeleteProject(currentProject.id)}
                    title="Delete Project"
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Instructions Bar */}
              <div className="px-4 py-1.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="truncate">
                  <strong className="font-semibold text-slate-700 dark:text-slate-300">Soul 1 Directive:</strong>{' '}
                  {currentProject.instructions || 'Standard project context active.'}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                  Auto-injected into prompt
                </span>
              </div>

              {/* Workspace Split: Files List (tabs) & Code Editor */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Files Column */}
                <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2 overflow-y-auto space-y-1 bg-slate-50/20 dark:bg-slate-900/20 shrink-0">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Files</span>
                    <button
                      type="button"
                      onClick={() => setShowAddFile(true)}
                      className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer"
                      title="Add file"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {Object.keys(currentProject.files).map((filename) => {
                    const isSelected = filename === selectedFile;
                    return (
                      <div
                        key={filename}
                        onClick={() => {
                          setSelectedFile(filename);
                          setFileContent(currentProject.files[filename]);
                          setIsEditingFile(false);
                        }}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{filename}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(filename);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* File Editor / Viewer */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900 text-xs shrink-0">
                    <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-violet-400" />
                      {selectedFile || 'No file selected'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveFileContent}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="project-file-editor-textarea"
                    value={fileContent}
                    onChange={(e) => {
                      setFileContent(e.target.value);
                      setIsEditingFile(true);
                    }}
                    spellCheck={false}
                    className="flex-1 w-full p-3 font-mono text-xs text-slate-200 bg-slate-950 resize-none focus:outline-hidden leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-xs">
              Select or create a project to inspect files.
            </div>
          )}
        </div>

        {/* Modal: Create Project Form */}
        {isCreatingProject && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateProject}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New Project</h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Discord Music Bot, PyTorch Transformer"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short summary of project goals..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newProjectCategory}
                  onChange={(e) => setNewProjectCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
                >
                  <option value="Discord Bots">Discord Bots</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Research & Analytics">Research & Analytics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructions for Andromeda Soul 1.0
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific rules, tech stack preferences, or safety directives..."
                  value={newProjectInstructions}
                  onChange={(e) => setNewProjectInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add File */}
        {showAddFile && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddFile}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xl"
            >
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Add New File</h3>
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. index.ts, config.py, .env.example"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFile(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
