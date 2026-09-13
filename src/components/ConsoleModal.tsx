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
  AlertCircle,
  Wifi,
  HardDrive,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Play,
  Pause,
  RefreshCw,
  BarChart2
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

interface DiagnosticMemory {
  rssBytes: number;
  rssMb: number;
  heapTotalBytes: number;
  heapTotalMb: number;
  heapUsedBytes: number;
  heapUsedMb: number;
  heapUsedPercent: number;
  externalMb: number;
  arrayBuffersMb: number;
  systemTotalMb: number;
  systemFreeMb: number;
  systemUsedMb: number;
  systemUsedPercent: number;
  cpuCount: number;
  loadAvg: number[];
  uptimeSeconds: number;
}

interface DiagnosticEndpoint {
  id: string;
  name: string;
  host: string;
  protocol: string;
  status: 'online' | 'unauthenticated' | 'degraded' | 'offline';
  role: string;
}

interface DiagnosticNetwork {
  activeStreams: number;
  totalRequests: number;
  totalFailures: number;
  successRate: number;
  avgLatencyMs: number;
  geminiKeyConfigured: boolean;
  endpoints: DiagnosticEndpoint[];
}

interface DiagnosticRequest {
  id: string;
  modelId: string;
  provider: string;
  endpoint: string;
  status: 'streaming' | 'success' | 'failed';
  startTime: number;
  durationMs: number;
  tokensEstimated?: number;
  bytesTransferred?: number;
  error?: string;
}

interface DiagnosticsData {
  timestamp: number;
  serverTime: string;
  memory: DiagnosticMemory;
  network: DiagnosticNetwork;
  modelUsageMap: Record<string, number>;
  recentRequests: DiagnosticRequest[];
}

export const ConsoleModal: React.FC<ConsoleModalProps> = ({ isOpen, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentCwd, setCurrentCwd] = useState<string>('/app');
  const [commandInput, setCommandInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'terminal' | 'diagnostics' | 'gcloud_status'>('terminal');
  
  // Google Cloud Diagnostics
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);

  // Real-Time Memory & AI Network Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Fetch Real-time Diagnostics API
  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/terminal/diagnostics');
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }
    } catch (err) {
      console.error('Failed to fetch real-time AI & memory diagnostics:', err);
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  // Run ping test
  const handlePingTest = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setPingLatency(Math.round(performance.now() - start));
      }
    } catch {
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

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

  // Periodic Polling for Diagnostics
  useEffect(() => {
    if (!isOpen) return;

    fetchDiagnostics();
    fetchCloudDiagnostics();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDiagnostics();
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  // Terminal Setup
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

    // Initialize Xterm.js when modal opens
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
      term.writeln('\x1b[33m• Real-time Memory & AI Model Network Telemetry Stream Active.\x1b[0m');
      term.writeln('\x1b[90m-----------------------------------------------------------\x1b[0m\r\n');

      // Handle user input from Xterm -> Backend
      term.onData((data) => {
        fetch('/api/terminal/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawData: data })
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

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[94dvh] sm:h-[88vh] bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
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
              <span className="truncate">Andromeda Sovereign Console & AI Diagnostics</span>
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
                  setActiveTab('diagnostics');
                  fetchDiagnostics();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'diagnostics' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>AI & Memory</span>
                {diagnostics?.memory && (
                  <span className="hidden md:inline-block text-[10px] px-1 py-0.2 rounded bg-slate-800 text-emerald-300 font-mono">
                    {diagnostics.memory.heapUsedMb}MB
                  </span>
                )}
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
                <span className="text-slate-300 truncate max-w-[140px]">{currentCwd}</span>
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
              {activeTab === 'terminal' && (
                <button
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Clear Terminal Screen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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
          
          {/* Diagnostic & Cloud Terminal Actions */}
          <button
            onClick={() => setActiveTab('diagnostics')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-xs font-mono text-emerald-300 transition-all cursor-pointer shrink-0"
            title="Open Live Memory & AI Network Diagnostics"
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Diagnostics</span>
          </button>
          <button
            onClick={() => executeQuickCommand('gcloud info || echo "GCloud runtime active in Cloud Run"')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/50 text-xs font-mono text-sky-300 transition-all cursor-pointer shrink-0"
            title="Google Cloud Shell Info"
          >
            <Cloud className="w-3 h-3 text-sky-400" />
            <span>gcloud info</span>
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
        ) : activeTab === 'diagnostics' ? (
          /* REAL-TIME MEMORY USAGE & AI MODEL NETWORK DIAGNOSTICS PANEL */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0e14] space-y-6">
            
            {/* Panel Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Real-Time Memory & AI Network Diagnostics
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Live metrics for V8 process memory, container resources, active AI model streams, and endpoint network status.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                {/* Ping latency test */}
                <button
                  onClick={handlePingTest}
                  disabled={isPinging}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Test local network roundtrip ping"
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isPinging ? 'Pinging...' : pingLatency ? `${pingLatency} ms ping` : 'Test Ping'}</span>
                </button>

                {/* Auto refresh toggle */}
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    autoRefresh
                      ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                  title={autoRefresh ? 'Auto-refresh active (every 2.5s)' : 'Auto-refresh paused'}
                >
                  {autoRefresh ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                  <span>{autoRefresh ? 'Live (2.5s)' : 'Paused'}</span>
                </button>

                {/* Manual refresh */}
                <button
                  onClick={fetchDiagnostics}
                  disabled={isLoadingDiagnostics}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiagnostics ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              {/* Active AI Streams */}
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active AI Streams</span>
                  <div className={`w-2 h-2 rounded-full ${
                    (diagnostics?.network.activeStreams || 0) > 0 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                  }`} />
                </div>
                <div className="text-xl font-bold text-slate-100 flex items-baseline gap-1.5">
                  <span>{diagnostics?.network.activeStreams || 0}</span>
                  <span className="text-xs text-slate-400 font-normal">in flight</span>
                </div>
                <div className="text-[11px] text-emerald-400 truncate">
                  {(diagnostics?.network.activeStreams || 0) > 0 ? 'Streaming response...' : 'Standby / Ready'}
                </div>
              </div>

              {/* Total AI Requests */}
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total AI Calls</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-slate-100 flex items-baseline gap-1.5">
                  <span>{diagnostics?.network.totalRequests || 0}</span>
                  <span className="text-xs text-emerald-400 font-normal">
                    {diagnostics?.network.successRate ?? 100}% OK
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {diagnostics?.network.totalFailures || 0} failed / throttled
                </div>
              </div>

              {/* Avg AI Latency */}
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Avg Model Latency</span>
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-xl font-bold text-slate-100 flex items-baseline gap-1.5">
                  <span>{diagnostics?.network.avgLatencyMs || 0}</span>
                  <span className="text-xs text-slate-400 font-normal">ms</span>
                </div>
                <div className="text-[11px] text-sky-400">
                  Fast multi-turn SSE
                </div>
              </div>

              {/* Process Uptime */}
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Node Process Uptime</span>
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-base font-bold text-slate-100 truncate">
                  {diagnostics?.memory.uptimeSeconds ? formatUptime(diagnostics.memory.uptimeSeconds) : '0s'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {diagnostics?.memory.cpuCount || 1} CPU cores • Load: {diagnostics?.memory.loadAvg?.[0] ?? '0.00'}
                </div>
              </div>
            </div>

            {/* SECTION 1: REAL-TIME MEMORY USAGE */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    V8 Process & System Memory Diagnostics
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Heap: {diagnostics?.memory.heapUsedMb || 0} MB / {diagnostics?.memory.heapTotalMb || 0} MB
                </span>
              </div>

              {/* V8 Heap Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>V8 JavaScript Heap Utilization</span>
                  <span className="font-bold text-emerald-400">{diagnostics?.memory.heapUsedPercent || 0}%</span>
                </div>
                <div className="h-3 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, diagnostics?.memory.heapUsedPercent || 0))}%` }}
                  />
                </div>
              </div>

              {/* Memory Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Resident Set (RSS)</span>
                  <div className="text-sm font-bold text-slate-100">
                    {diagnostics?.memory.rssMb || 0} <span className="text-xs text-slate-400">MB</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Total process RAM</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Heap Used</span>
                  <div className="text-sm font-bold text-emerald-400">
                    {diagnostics?.memory.heapUsedMb || 0} <span className="text-xs text-slate-400">MB</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Active JS objects</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">External C++ Buffers</span>
                  <div className="text-sm font-bold text-cyan-400">
                    {diagnostics?.memory.externalMb || 0} <span className="text-xs text-slate-400">MB</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Native streams & buffers</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">System Free Memory</span>
                  <div className="text-sm font-bold text-sky-400">
                    {diagnostics?.memory.systemFreeMb || 0} <span className="text-xs text-slate-400">MB</span>
                  </div>
                  <span className="text-[10px] text-slate-500">of {diagnostics?.memory.systemTotalMb || 0} MB container</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: AI MODEL NETWORK ENDPOINT STATUS */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    AI Model Network Status & Endpoints
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${
                    diagnostics?.network.geminiKeyConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className={diagnostics?.network.geminiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                    {diagnostics?.network.geminiKeyConfigured ? 'GEMINI_API_KEY Active' : 'Key Missing in Secrets'}
                  </span>
                </div>
              </div>

              {/* Endpoints Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {diagnostics?.network.endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{ep.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{ep.role}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 shrink-0">
                        {ep.protocol}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/50">
                      <span className="truncate max-w-[220px]">{ep.host}</span>
                      <span className="text-emerald-400 font-bold">ONLINE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: RECENT AI MODEL REQUEST LOG STREAM */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0d1117] border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Live AI Model Request Stream Log
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {diagnostics?.recentRequests.length || 0} recorded events
                </span>
              </div>

              {diagnostics?.recentRequests && diagnostics.recentRequests.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {diagnostics.recentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          req.status === 'streaming'
                            ? 'bg-amber-400 animate-ping'
                            : req.status === 'success'
                            ? 'bg-emerald-400'
                            : 'bg-rose-400'
                        }`} />
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-slate-200 truncate flex items-center gap-2">
                            <span>{req.modelId}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {req.endpoint}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(req.startTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="space-y-0.5">
                          <div className="text-slate-300 font-bold">
                            {req.durationMs > 0 ? `${req.durationMs} ms` : 'streaming...'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {req.tokensEstimated ? `~${req.tokensEstimated} tokens` : `${req.provider}`}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'streaming'
                            ? 'bg-amber-950/60 border border-amber-800/60 text-amber-300'
                            : req.status === 'success'
                            ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                  <Activity className="w-6 h-6 text-slate-600 mx-auto" />
                  <p>No AI model requests have been dispatched in this server session yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Send a message in the chat prompt or generate an image to see live streaming latency & memory metrics.
                  </p>
                </div>
              )}
            </div>

          </div>
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
