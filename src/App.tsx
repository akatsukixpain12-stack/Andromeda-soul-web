import React, { useState, useEffect, useRef } from 'react';
import { AndromedaNavbar } from './components/AndromedaNavbar';
import { AndromedaSidebar } from './components/AndromedaSidebar';
import { AndromedaChatArea } from './components/AndromedaChatArea';
import { ProvidersModal } from './components/ProvidersModal';
import { AuthModal } from './components/AuthModal';
import { ImageCreationModal } from './components/ImageCreationModal';
import { ConsoleModal } from './components/ConsoleModal';
import { DiscordModal } from './components/DiscordModal';
import { Conversation, ChatMessage, ChatAttachment, UserSettings, UserProfile } from './types';
import { DEFAULT_SETTINGS } from './data/defaultSettings';
import { streamMultiProviderChat } from './lib/aiClient';
import { AI_MODELS, findModelById } from './data/models';
import {
  auth,
  dbSaveConversation,
  dbDeleteConversation,
  dbSubscribeConversations,
  dbSaveUserProfile,
  dbSaveUserSettings,
  dbLoadUserSettings
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY_CONVERSATIONS = 'andromeda_session_conversations_v5';
const STORAGE_KEY_SETTINGS = 'andromeda_session_settings_v5';
const STORAGE_KEY_USER_PROFILE = 'andromeda_user_profile_v4';

const createDefaultConversation = (): Conversation => ({
  id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  title: 'New Conversation',
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export function App() {
  // Load settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // User Profile / Firebase Auth State (Strictly client-isolated)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [cloudSettingsReady, setCloudSettingsReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [createDefaultConversation()];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || `chat-${Date.now()}`;
  });

  const [selectedModelId, setSelectedModelId] = useState<string>(
    settings.defaultModelId || 'andromeda-soul-1'
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
  const [isMediaEngineOpen, setIsMediaEngineOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingThought, setStreamingThought] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep anonymous data in this browser tab only. Never expose it to another visitor.
  useEffect(() => {
    if (!currentUser || currentUser.provider === 'guest') {
      try {
        sessionStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
      } catch (e) {
        console.warn('Failed to persist session conversations:', e);
      }
    }
  }, [conversations, currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.provider === 'guest') {
      try {
        sessionStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      } catch (e) {
        console.warn('Failed to persist session settings:', e);
      }
    }
  }, [settings, currentUser]);

  // Preserve Firebase's durable Google auth session; guest data remains session-only.
  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;
      const fresh = createDefaultConversation();

      if (user && !user.isAnonymous) {
        setCloudSettingsReady(false);
        const profile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'Andromeda Creator',
          avatar: user.photoURL || '',
          provider: 'google',
          signedInAt: Date.now(),
        };
        setConversations([fresh]);
        setActiveConversationId(fresh.id);
        setCurrentUser(profile);
        dbSaveUserProfile(user.uid, profile);
        dbLoadUserSettings(user.uid).then((savedSettings) => {
          if (cancelled) return;
          if (savedSettings) setSettings((previous) => ({ ...previous, ...savedSettings }));
          setCloudSettingsReady(true);
        });
      } else {
        setCurrentUser(null);
        setConversations([fresh]);
        setActiveConversationId(fresh.id);
        setCloudSettingsReady(true);
      }
      setIsAuthReady(true);
    }, (error) => {
      console.error('Unable to initialize private auth session:', error);
      setCloudSettingsReady(true);
      setIsAuthReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // One-time cleanup of any legacy keys from previous app versions
  useEffect(() => {
    try {
      const legacyKeys = [
        'andromeda_conversations_v1',
        'andromeda_conversations_v2',
        'andromeda_conversations_v3',
        'andromeda_guest_conversations_v4',
        'andromeda_settings_v4',
        'andromeda_user_profile_v1',
        'andromeda_user_profile_v2',
        'andromeda_user_profile_v3',
      ];
      legacyKeys.forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {
      // ignore
    }
  }, []);

  // Firebase Firestore real-time sync for Conversations list (ONLY when signed in with Firebase)
  useEffect(() => {
    if (!isAuthReady || !currentUser || currentUser.provider !== 'google' || !auth.currentUser || auth.currentUser.uid !== currentUser.id) {
      return;
    }

    const unsubscribe = dbSubscribeConversations(currentUser.id, (list) => {
      if (list.length === 0) {
        const fresh = createDefaultConversation();
        setConversations([fresh]);
        setActiveConversationId(fresh.id);
        dbSaveConversation(currentUser.id, fresh);
      } else {
        setConversations(list);
        if (!list.some(c => c.id === activeConversationId)) {
          setActiveConversationId(list[0].id);
        }
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, isAuthReady]);

  // Sync settings to Firestore for signed in users
  useEffect(() => {
    if (isAuthReady && cloudSettingsReady && currentUser && currentUser.provider === 'google' && auth.currentUser && auth.currentUser.uid === currentUser.id) {
      dbSaveUserSettings(currentUser.id, settings);
    }
  }, [settings, currentUser, isAuthReady, cloudSettingsReady]);

  // URL callback parameter cleanup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get('auth_success');
    const authError = params.get('auth_error');
    const githubSuccess = params.get('github_success');
    const githubError = params.get('github_error');
    const githubUser = params.get('username');

    if (authSuccess === 'true' || authError || githubSuccess === 'true' || githubError) {
      if (authError) {
        console.error('Google Auth callback error:', authError);
        alert(`Google Authentication Failed: ${authError}`);
      } else if (githubSuccess === 'true') {
        alert(`Successfully connected to GitHub account: ${githubUser || 'connected'}`);
      } else if (githubError) {
        alert(`GitHub connection failed: ${githubError}`);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

    if (currentUser && currentUser.provider !== 'guest') {
      dbSaveConversation(currentUser.id, newConv);
    }
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
        if (currentUser && currentUser.provider !== 'guest') {
          dbSaveConversation(currentUser.id, fallback);
        }
        return [fallback];
      }
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });

    if (currentUser && currentUser.provider !== 'guest') {
      dbDeleteConversation(currentUser.id, id);
    }
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c));
      if (currentUser && currentUser.provider !== 'guest') {
        const target = updated.find((c) => c.id === id);
        if (target) {
          dbSaveConversation(currentUser.id, target);
        }
      }
      return updated;
    });
  };

  // Toggle Pin
  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
      if (currentUser && currentUser.provider !== 'guest') {
        const target = updated.find((c) => c.id === id);
        if (target) {
          dbSaveConversation(currentUser.id, target);
        }
      }
      return updated;
    });
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
            const updated = {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: Date.now(),
            };
            if (currentUser && currentUser.provider !== 'guest') {
              dbSaveConversation(currentUser.id, updated);
            }
            return updated;
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
      if (currentUser && currentUser.provider !== 'guest') {
        dbSaveConversation(currentUser.id, newConv);
      }
    } else {
      const isFirstMessage = currentConv.messages.length === 0;
      const newTitle = isFirstMessage ? prompt.slice(0, 36) || 'New Conversation' : currentConv.title;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            const updated = {
              ...c,
              title: newTitle,
              messages: [...c.messages, userMessage],
              updatedAt: Date.now(),
            };
            if (currentUser && currentUser.provider !== 'guest') {
              dbSaveConversation(currentUser.id, updated);
            }
            return updated;
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
    const modelMeta = findModelById(selectedModelId, settings.customModels);

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
            const updated = {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: Date.now(),
            };
            if (currentUser && currentUser.provider !== 'guest') {
              dbSaveConversation(currentUser.id, updated);
            }
            return updated;
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
          prev.map((c) => {
            if (c.id === targetConvId) {
              const updated = { ...c, messages: [...c.messages, errorMessage] };
              if (currentUser && currentUser.provider !== 'guest') {
                dbSaveConversation(currentUser.id, updated);
              }
              return updated;
            }
            return c;
          })
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
    <div className="flex h-[100dvh] w-full max-w-full bg-[#FAF9F5] text-[#1C1917] overflow-hidden select-text">
      {/* 1. Left Sidebar (Collapsible drawer with chats, search, and free provider widgets) */}
      <AndromedaSidebar
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
        onOpenMediaEngine={() => setIsMediaEngineOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenDiscord={() => setIsDiscordModalOpen(true)}
        currentUser={currentUser}
        settings={settings}
      />

      {/* 2. Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Top Navbar: Brand, Title, Model Dropdown (Gemini, Claude, Ollama, LM Studio), Actions */}
        <AndromedaNavbar
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
          customModels={settings.customModels}
        />

        {/* Central Chat Thread with Thinking Accordions and Floating Claude Input Pill */}
        <AndromedaChatArea
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
          userName={currentUser?.name || 'Creator'}
          currentUser={currentUser}
          onOpenProvidersModal={() => setIsProvidersModalOpen(true)}
          onOpenDiscord={() => setIsDiscordModalOpen(true)}
          customModels={settings.customModels}
        />
      </div>

      {/* 3. Providers & Settings Modal */}
      <ProvidersModal
        isOpen={isProvidersModalOpen}
        onClose={() => setIsProvidersModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          if (currentUser?.id && currentUser.provider !== 'guest') {
            dbSaveUserSettings(currentUser.id, newSettings).catch(console.error);
          }
        }}
      />

      {/* 4. Google Auth & User Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(profile) => {
          setCurrentUser(profile);
          const fresh = createDefaultConversation();
          setConversations([fresh]);
          setActiveConversationId(fresh.id);
        }}
        onLogout={() => {
          setCurrentUser(null);
          const fresh = createDefaultConversation();
          setConversations([fresh]);
          setActiveConversationId(fresh.id);
          setSettings((prev) => {
            const next = { ...prev };
            delete next.userEmail;
            delete next.userName;
            delete next.userAvatar;
            return next;
          });
          try {
            sessionStorage.removeItem(STORAGE_KEY_CONVERSATIONS);
            sessionStorage.removeItem(STORAGE_KEY_SETTINGS);
            sessionStorage.removeItem(STORAGE_KEY_USER_PROFILE);
            localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
          } catch {
            // ignore
          }
        }}
      />

      {/* 5. Creative Media Engine Studio (Image & Video Generation) */}
      <ImageCreationModal
        isOpen={isMediaEngineOpen}
        onClose={() => setIsMediaEngineOpen(false)}
        onSendToChat={(imageUrl, prompt) => {
          handleSendMessage(`Visual Asset Generated: "${prompt}"`, [{
            id: `img-${Date.now()}`,
            name: 'Generated Image',
            type: 'image/png',
            size: 0,
            data: imageUrl,
            previewUrl: imageUrl
          }]);
        }}
      />

      {/* 6. Built-in Bash Shell Terminal */}
      <ConsoleModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      {/* 7. Discord Bot & Autonomous Code Gateway (/discord) */}
      <DiscordModal
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        onSendBotCommand={(cmd) => handleSendMessage(cmd)}
      />
    </div>
  );
}

export default App;
