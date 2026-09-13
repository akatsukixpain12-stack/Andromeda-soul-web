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
  Zap
} from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface ConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsoleModal: React.FC<ConsoleModalProps> = ({ isOpen, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentCwd, setCurrentCwd] = useState<string>('/app');
  const [commandInput, setCommandInput] = useState<string>('');

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
      const term = new Terminal({
        fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
        fontSize: 13,
        lineHeight: 1.2,
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
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Write welcome banner
      term.writeln('\x1b[36m===========================================================\x1b[0m');
      term.writeln('\x1b[35m    _   _  _ ___  ___   ___  __  __ ___ ___   _   ___  \x1b[0m');
      term.writeln('\x1b[35m   /_\\ | \\| |   \\| _ \\ / _ \\|  \\/  | __|   \\ /_\\ | _ \\ \x1b[0m');
      term.writeln('\x1b[35m  / _ \\| .` | |) |   /| (_) | |\\/| | _|| |) / _ \\|   / \x1b[0m');
      term.writeln('\x1b[35m /_/ \\_\\_|\\_|___/|_|_\\ \\___/|_|  |_|___|___/_/ \\_\\_|_\\ \x1b[0m');
      term.writeln('\x1b[36m===========================================================\x1b[0m');
      term.writeln('\x1b[32m• Robust Xterm.js Sovereign Shell Engine Active\x1b[0m');
      term.writeln('\x1b[33m• Supports Ollama interaction, local compilation, and full bash streaming.\x1b[0m');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-[#0d1117] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Window Titlebar */}
        <div className="h-12 bg-[#0a0e14] border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs font-semibold">
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span>Andromeda Sovereign Xterm Shell</span>
            </div>
          </div>

          {/* Status & Directory Indicator */}
          <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 truncate max-w-[240px]">{currentCwd}</span>
            </span>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              status === 'connected' 
                ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' 
                : status === 'connecting'
                ? 'bg-amber-950/30 border-amber-900/50 text-amber-400'
                : 'bg-rose-950/30 border-rose-900/50 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="capitalize">{status}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
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

        {/* Quick Action Toolbar */}
        <div className="px-4 py-2 bg-[#0d1117] border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">Quick Actions:</span>
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
          <button
            onClick={() => executeQuickCommand('python3 server/learning_node.py train')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-violet-300 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>train ml model</span>
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

        {/* Xterm.js Container Viewport */}
        <div className="flex-1 relative overflow-hidden bg-[#0d1117] p-2">
          <div ref={terminalRef} className="w-full h-full" />
        </div>

        {/* Command Footer Input Bar */}
        <form onSubmit={handleCustomCommandSubmit} className="h-14 bg-[#0a0e14] border-t border-slate-800 px-4 flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold">
            <span>$</span>
          </div>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type command to execute in Xterm shell..."
            className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-600 font-mono text-xs focus:ring-0"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!commandInput.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
          >
            <span>Execute</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
