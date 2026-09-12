import React, { useState, useEffect, useRef } from 'react';
import { ClaudeNavbar } from './components/ClaudeNavbar';
import { ClaudeSidebar } from './components/ClaudeSidebar';
import { ClaudeChatArea } from './components/ClaudeChatArea';
import { ProvidersModal } from './components/ProvidersModal';
import { AuthModal } from './components/AuthModal';
import { Conversation, ChatMessage, ChatAttachment, UserSettings, UserProfile } from './types';
import { DEFAULT_SETTINGS } from './data/defaultSettings';
import { streamMultiProviderChat } from './lib/aiClient';
import { AI_MODELS } from './data/models';

const STORAGE_KEY_CONVERSATIONS = 'andromeda_conversations_v3';
const STORAGE_KEY_SETTINGS = 'andromeda_settings_v3';
const STORAGE_KEY_USER_PROFILE = 'andromeda_user_profile_v3';

const INITIAL_CONVERSATION: Conversation = {
  id: 'welcome-andromeda-1',
  title: 'Welcome to Andromeda Sovereign Studio',
  messages: [
    {
      id: 'msg-welcome-user',
      role: 'user',
      content: 'Can you show me how Andromeda supports Google Auth, Andromeda Soul 1 uncapped intelligence, and multi-provider models?',
      timestamp: Date.now() - 60000,
    },
    {
      id: 'msg-welcome-assistant',
      role: 'assistant',
      model: 'Andromeda Soul 1 (Uncapped)',
      thought: `System Initialization & Sovereign Protocol Check:
1. Active Persona: Andromeda Soul 1 (Frontier Uncapped Intelligence, Master Software Architect).
2. Connected Auth: Google Sign-In & Sovereign Local Storage Session.
3. Multi-Provider Router ready:
   - Andromeda Soul 1: Uncapped frontier architecture & reasoning
   - Google Gemini 2.5 Flash: Free tier, ultra-low latency & 1M context
   - Anthropic Claude 3.7: Extended chain-of-thought thinking
   - Ollama Localhost: 100% Free & private offline models (DeepSeek-R1, Llama 3.2)
   - LM Studio: Localhost:1234 OpenAI-compatible backend.`,
      content: `### Welcome to Andromeda Sovereign AI Studio

Andromeda provides a high-performance, distraction-free environment combining **Frontier Uncapped AI** with **Google Authentication** and unified multi-provider routing (Gemini, Claude, and 100% free local models with Ollama and LM Studio).

---

### Key Capabilities

| Provider & Model | Intelligence Tier | Connectivity | Key Features |
| :--- | :--- | :--- | :--- |
| 🚀 **Andromeda Soul 1** | **Frontier Uncapped** | Cloud & Sovereign Node | Deep reasoning, PyTorch models, full-stack architecture |
| ⚡ **Google Gemini 2.5 Flash** | **Free Tier (Google)** | Cloud API | Ultra-low latency, multimodal, 1M context token window |
| 🧠 **Claude 3.7 Sonnet** | **Extended Thinking** | API & CoT Stream | Deep step-by-step reasoning traces & analytical proofs |
| 🦙 **Ollama Local** | **100% Free & Offline** | \`http://localhost:11434\` | Zero token fees, private offline models (\`deepseek-r1:8b\`, \`llama3.2\`) |
| 🔮 **LM Studio** | **100% Free Local** | \`http://localhost:1234/v1\` | High-speed local GGUF inference |

---

### Google Authentication
Click **Google Auth** in the top navigation bar or the user profile button in the sidebar to authenticate with your Google account. Your session and sovereign workspace settings will be safely synchronized.

### Running Local Ollama (Free):
If you would like to run offline models locally on your machine:
\`\`\`bash
# Start Ollama with browser CORS enabled
OLLAMA_ORIGINS="*" ollama serve

# Pull and run DeepSeek-R1 or Llama 3.2
ollama run deepseek-r1:8b
\`\`\`

How can Andromeda assist your engineering and research today?`,
      timestamp: Date.now() - 30000,
    },
  ],
  createdAt: Date.now() - 60000,
  updatedAt: Date.now() - 30000,
  pinned: true,
};

export function App() {
  // Load settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load User Profile / Google Auth
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      id: 'usr-andromeda-master',
      name: 'Master Architect',
      email: 'akatsuki.x.pain12@gmail.com',
      provider: 'google',
      avatar: '',
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      return saved ? JSON.parse(saved) : [INITIAL_CONVERSATION];
    } catch {
      return [INITIAL_CONVERSATION];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || INITIAL_CONVERSATION.id
  );

  const [selectedModelId, setSelectedModelId] = useState<string>(
    settings.defaultModelId || 'andromeda-soul-1'
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingThought, setStreamingThought] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to persist conversations:', e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
      }
    } catch (e) {
      console.warn('Failed to persist user profile:', e);
    }
  }, [currentUser]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const activeMessages = activeConversation ? activeConversation.messages : [];

  // Create New Chat
  const handleNewChat = () => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingMessage('');
    setStreamingThought('');

    const newConv: Conversation = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModelId,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fallback: Conversation = {
          id: `chat-${Date.now()}`,
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveConversationId(fallback.id);
        return [fallback];
      }
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Toggle Pin
  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    if (streamingMessage.trim() || streamingThought.trim()) {
      const assistantMessage: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: streamingMessage.trim(),
        thought: streamingThought.trim() || undefined,
        model: AI_MODELS.find((m) => m.id === selectedModelId)?.name || 'AI Assistant',
        timestamp: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: Date.now(),
            };
          }
          return c;
        })
      );
    }
    setStreamingMessage('');
    setStreamingThought('');
  };

  // Send Message
  const handleSendMessage = async (
    prompt: string,
    attachments: ChatAttachment[] = [],
    enableThinking: boolean = true
  ) => {
    if ((!prompt.trim() && attachments.length === 0) || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: Date.now(),
    };

    // Update conversation with user message & auto-generate title if first message
    let targetConvId = activeConversationId;
    let currentConv = activeConversation;

    if (!currentConv) {
      const newConv: Conversation = {
        id: `chat-${Date.now()}`,
        title: prompt.slice(0, 36) || 'New Conversation',
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      targetConvId = newConv.id;
      currentConv = newConv;
    } else {
      const isFirstMessage = currentConv.messages.length === 0;
      const newTitle = isFirstMessage ? prompt.slice(0, 36) || 'New Conversation' : currentConv.title;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              title: newTitle,
              messages: [...c.messages, userMessage],
              updatedAt: Date.now(),
            };
          }
          return c;
        })
      );
    }

    // Begin streaming
    setIsStreaming(true);
    setStreamingMessage('');
    setStreamingThought('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const historyForAi = currentConv ? [...currentConv.messages, userMessage] : [userMessage];
    const modelMeta = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];

    try {
      const finalAccumulated = await streamMultiProviderChat({
        prompt,
        history: historyForAi,
        modelId: selectedModelId,
        systemInstruction: settings.systemInstruction,
        enableThinking,
        attachments,
        settings,
        onToken: (chunk: string) => {
          setStreamingMessage((prev) => prev + chunk);
        },
        onThought: (thought: string) => {
          setStreamingThought((prev) => (prev ? prev + '\n' + thought : thought));
        },
        signal: controller.signal,
      });

      const assistantMessage: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: finalAccumulated || streamingMessage,
        thought: streamingThought || undefined,
        model: modelMeta.name,
        timestamp: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: Date.now(),
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat stream failed:', err);
        const errorMessage: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Generation Error**: ${err.message || 'Failed to complete stream.'}\n\nPlease check your model settings in **Providers & Keys** or switch to Gemini 2.5 Flash for free tier access.`,
          model: modelMeta.name,
          timestamp: Date.now(),
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, errorMessage] } : c))
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
      setStreamingThought('');
      abortControllerRef.current = null;
    }
  };

  // Regenerate last turn
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;

    // Find last user message
    const msgs = [...activeConversation.messages];
    const lastMsg = msgs[msgs.length - 1];

    let promptToReplay = '';
    let attachmentsToReplay: ChatAttachment[] | undefined;

    if (lastMsg.role === 'assistant') {
      msgs.pop(); // remove assistant reply
      const prevUserMsg = msgs[msgs.length - 1];
      if (prevUserMsg && prevUserMsg.role === 'user') {
        promptToReplay = prevUserMsg.content;
        attachmentsToReplay = prevUserMsg.attachments;
        msgs.pop(); // remove user message to re-send cleanly
      }
    } else if (lastMsg.role === 'user') {
      promptToReplay = lastMsg.content;
      attachmentsToReplay = lastMsg.attachments;
      msgs.pop();
    }

    if (promptToReplay) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, messages: msgs } : c))
      );
      handleSendMessage(promptToReplay, attachmentsToReplay || []);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#FAF9F5] text-[#1C1917] overflow-hidden select-text">
      {/* 1. Left Sidebar (Collapsible drawer with chats, search, and free provider widgets) */}
      <ClaudeSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsProvidersModalOpen(true)}
        onOpenProviders={() => setIsProvidersModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        settings={settings}
      />

      {/* 2. Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar: Brand, Title, Model Dropdown (Gemini, Claude, Ollama, LM Studio), Actions */}
        <ClaudeNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          onOpenProvidersModal={() => setIsProvidersModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          activeConversationTitle={activeConversation?.title}
          onRenameActiveConversation={(title) => handleRenameConversation(activeConversationId, title)}
        />

        {/* Central Chat Thread with Thinking Accordions and Floating Claude Input Pill */}
        <ClaudeChatArea
          messages={activeMessages}
          streamingMessage={streamingMessage}
          streamingThought={streamingThought}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onRegenerate={handleRegenerate}
          onClearChat={() => {
            if (activeConversationId) {
              setConversations((prev) =>
                prev.map((c) => (c.id === activeConversationId ? { ...c, messages: [] } : c))
              );
            }
          }}
          onNewChat={handleNewChat}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          userName={currentUser?.name || settings.userName || 'User'}
          currentUser={currentUser}
          onOpenProvidersModal={() => setIsProvidersModalOpen(true)}
        />
      </div>

      {/* 3. Providers & Settings Modal */}
      <ProvidersModal
        isOpen={isProvidersModalOpen}
        onClose={() => setIsProvidersModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />

      {/* 4. Google Auth & User Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(profile) => {
          setCurrentUser(profile);
          setSettings((prev) => ({
            ...prev,
            userName: profile.name,
            userEmail: profile.email,
            userAvatar: profile.avatar,
          }));
        }}
        onLogout={() => {
          setCurrentUser(null);
        }}
      />
    </div>
  );
}

export default App;
