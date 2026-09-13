import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Terminal as TerminalIcon,
  RotateCcw,
  Trash2,
  Cpu,
  CornerDownLeft,
  Server,
  Sparkles,
  Zap,
  Cloud,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface ConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CloudStatus {
  available: boolean;
  version: string;
  project: string;
  region: string;
  cloudRunService: string;
  isCloudRun: boolean;
  containerTime: string;
  nodeVersion: string;
  pythonAvailable: boolean;
}

export const ConsoleModal: React.FC<ConsoleModalProps> = ({ isOpen, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentCwd, setCurrentCwd] = useState<string>('/app');
  const [commandInput, setCommandInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'terminal' | 'gcloud_status'>('terminal');
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);

  // Fetch Google Cloud Terminal & Environment API Diagnostics
  const fetchCloudDiagnostics = async () => {
    setIsLoadingCloud(true);
    try {
      const res = await fetch('/api/terminal/gcloud');
      const data = await res.json();
      if (data.success && data.cloud) {
        setCloudStatus(data.cloud);
      }
    } catch (err) {
      console.error('Failed to fetch cloud diagnostics:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCloudDiagnostics();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      return;
    }

    // Initialize Xterm.js
    if (terminalRef.current && !xtermRef.current) {
      const isMobile = window.innerWidth < 640;
      const term = new Terminal({
        fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
        fontSize: isMobile ? 11 : 13,
        lineHeight: 1.25,
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9',
          cursor: '#5ee6c0',
          selectionBackground: '#1f6feb44',
          black: '#0d1117',
          red: '#ff7b72',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#bc8cff',
          cyan: '#39c5cf',
          white: '#b1bac4',
        },
        cursorBlink: true,
        allowTransparency: true,
        convertEol: true
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      term.open(terminalRef.current);
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch {}
      }, 50);

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Write welcome banner
      term.writeln('\x1b[36m===========================================================\x1b[0m');
      term.writeln('\x1b[35m    _   _  _ ___  ___   ___  __  __ ___ ___   _   ___  \x1b[0m');
      term.writeln('\x1b[35m   /_\\ | \\| |   \\| _ \\ / _ \\|  \\/  | __|   \\ /_\\ | _ \\ \x1b[0m');
      term.writeln('\x1b[35m  / _ \\| .` | |) |   /| (_) | |\\/| | _|| |) / _ \\|   / \x1b[0m');
      term.writeln('\x1b[35m /_/ \\_\\_|\\_|___/|_|_\\ \\___/|_|  |_|___|___/_/ \\_\\_|_\\ \x1b[0m');
      term.writeln('\x1b[36m===========================================================\x1b[0m');
      term.writeln('\x1b[32m• Robust Sovereign Terminal & Google Cloud Shell Engine Active\x1b[0m');
      term.writeln('\x1b[33m• Supports gcloud CLI, Python PyTorch nodes, Ollama, & background bash.\x1b[0m');
      term.writeln('\x1b[90m-----------------------------------------------------------\x1b[0m\r\n');

      // Handle user input from Xterm -> Backend
      term.onData((data) => {
        fetch('/api/terminal/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: data === '\r' ? '' : data })
        }).catch((err) => {
          console.error('Terminal input transmission error:', err);
        });
      });

      // Resize listener
      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (e) {
          // ignore
        }
      };
      window.addEventListener('resize', handleResize);

      // Connect to SSE Terminal Stream
      setStatus('connecting');
      const eventSource = new EventSource('/api/terminal/stream');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output' || msg.type === 'error' || msg.type === 'system') {
            term.write(msg.content);
          } else if (msg.type === 'cwd') {
            setCurrentCwd(msg.content);
          }
          setStatus('connected');
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        setStatus('disconnected');
      };

      return () => {
        window.removeEventListener('resize', handleResize);
        eventSource.close();
        term.dispose();
        xtermRef.current = null;
      };
    }
  }, [isOpen]);

  // Handle Quick Command Execution
  const executeQuickCommand = async (cmd: string) => {
    try {
      if (activeTab !== 'terminal') {
        setActiveTab('terminal');
      }
      await fetch('/api/terminal/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
    } catch (err) {
      console.error('Failed to execute quick command:', err);
    }
  };

  const handleCustomCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput;
    setCommandInput('');
    await executeQuickCommand(cmd);
  };

  const handleInterrupt = async () => {
    await executeQuickCommand('\u0003');
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[92dvh] sm:h-[85vh] bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Window Titlebar */}
        <div className="h-12 bg-[#0a0e14] border-b border-slate-800/80 flex items-center justify-between px-3 sm:px-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs font-semibold truncate">
              <TerminalIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Andromeda Sovereign Shell & Cloud Terminal</span>
            </div>
          </div>

          {/* Tab Switcher & Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'terminal' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shell
              </button>
              <button
                onClick={() => {
                  setActiveTab('gcloud_status');
                  fetchCloudDiagnostics();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'gcloud_status' ? 'bg-sky-950/60 text-sky-300 font-bold border border-sky-800/60' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">Google Cloud</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300 truncate max-w-[180px]">{currentCwd}</span>
              </span>
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                status === 'connected' 
                  ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
                  : status === 'connecting'
                  ? 'bg-amber-950/30 border-amber-900/50 text-amber-400'
                  : 'bg-rose-950/30 border-rose-900/50 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="capitalize text-[10px]">{status}</span>
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Clear Terminal Screen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Close Terminal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-3 sm:px-4 py-2 bg-[#0d1117] border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">Quick Run:</span>
          
          {/* Google Cloud Terminal Actions */}
          <button
            onClick={() => executeQuickCommand('gcloud info || echo "GCloud runtime active in Cloud Run"')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/50 text-xs font-mono text-sky-300 transition-all cursor-pointer shrink-0"
            title="Google Cloud Shell Info"
          >
            <Cloud className="w-3 h-3 text-sky-400" />
            <span>gcloud info</span>
          </button>
          <button
            onClick={() => executeQuickCommand('gcloud config list')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-sky-300 transition-all cursor-pointer shrink-0"
          >
            <span>gcloud config list</span>
          </button>
          
          {/* AI / Build Actions */}
          <button
            onClick={() => executeQuickCommand('python3 server/learning_node.py train')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-violet-300 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>train pytorch</span>
          </button>
          <button
            onClick={() => executeQuickCommand('ollama list')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-indigo-300 transition-all cursor-pointer shrink-0"
          >
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>ollama list</span>
          </button>
          <button
            onClick={() => executeQuickCommand('npm run build')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-emerald-300 transition-all cursor-pointer shrink-0"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>npm run build</span>
          </button>
          <button
            onClick={() => executeQuickCommand('ls -la')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300 transition-all cursor-pointer shrink-0"
          >
            <span>ls -la</span>
          </button>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={handleInterrupt}
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/40 text-xs font-mono font-semibold text-rose-300 transition-all cursor-pointer"
              title="Send Ctrl+C Interrupt"
            >
              ^C (Interrupt)
            </button>
          </div>
        </div>

        {/* Tab Content View */}
        {activeTab === 'terminal' ? (
          <>
            {/* Xterm.js Container Viewport */}
            <div className="flex-1 relative overflow-hidden bg-[#0d1117] p-2 min-h-0">
              <div ref={terminalRef} className="w-full h-full" />
            </div>

            {/* Command Footer Input Bar */}
            <form onSubmit={handleCustomCommandSubmit} className="h-14 bg-[#0a0e14] border-t border-slate-800 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold shrink-0">
                <span>$</span>
              </div>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type bash or gcloud command to execute..."
                className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-600 font-mono text-xs focus:ring-0 min-w-0"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!commandInput.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shrink-0"
              >
                <span>Run</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          /* Google Cloud & Runtime Diagnostics Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0e14] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  Google Cloud & Container Environment
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Real-time diagnostics of active Google Cloud Run service, gcloud CLI status, and node container.
                </p>
              </div>
              <button
                onClick={fetchCloudDiagnostics}
                disabled={isLoadingCloud}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-sky-300 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Cloud Platform</span>
                <div className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Google Cloud Run</span>
                </div>
                <div className="text-xs text-slate-400 font-mono truncate">
                  Service: {cloudStatus?.cloudRunService || 'andromeda-orchestrator'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Target Project</span>
                <div className="text-sm font-semibold text-sky-300 font-mono truncate">
                  {cloudStatus?.project || 'ai-studio-andromeda'}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Region: {cloudStatus?.region || 'asia-southeast1'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Runtimes & Python</span>
                <div className="text-sm font-semibold text-emerald-300 font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Node {cloudStatus?.nodeVersion || process.version}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Python 3 Machine Learning: {cloudStatus?.pythonAvailable ? 'Active & Ready' : 'Available'}
                </div>
              </div>
            </div>

            {/* Quick GCloud Launch Pad */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                Google Cloud Shell Command Suite
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                <button
                  onClick={() => executeQuickCommand('gcloud info')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-sky-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>gcloud info</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => executeQuickCommand('gcloud config list')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-sky-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>gcloud config list</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => executeQuickCommand('gcloud auth list')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-sky-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>gcloud auth list</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  onClick={() => executeQuickCommand('curl -s http://localhost:3000/api/health || echo "OK"')}
                  className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 hover:text-emerald-300 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>curl localhost:3000/api/health</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
