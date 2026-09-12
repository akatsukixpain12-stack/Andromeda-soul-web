export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data string (e.g. data:image/png;base64,...)
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  modelId?: string;
  attachments?: ChatAttachment[];
  thought?: string;
  isDeepThinking?: boolean;
  generatedImages?: GeneratedImage[];
  error?: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  provider: 'google' | 'apple' | 'guest';
  connectedAt?: number;
  signedInAt?: number;
}

export interface GitHubUser {
  login: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
  public_repos?: number;
  total_private_repos?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  default_branch: string;
  html_url: string;
  updated_at: string;
}

export interface GeneratedProject {
  id: string;
  name?: string;
  title: string;
  description: string;
  category: string;
  defaultFolder?: string;
  files: Record<string, string>;
  createdAt?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model?: string;
  pinned?: boolean;
  agentId?: string;
  projectId?: string;
}

export type AIProvider = 'gemini' | 'claude' | 'ollama' | 'lmstudio' | 'groq' | 'openrouter';

export interface AIModelOption {
  id: string;
  name: string;
  provider?: AIProvider;
  providerLabel?: string;
  description: string;
  badge: string;
  isFree?: boolean;
  speed: string;
  intelligence: string;
  supportsThinking?: boolean;
  isDefault?: boolean;
}

export type GeminiModel = AIModelOption;

export interface ProviderConnectionStatus {
  gemini: boolean;
  ollama: boolean;
  lmstudio: boolean;
  groq: boolean;
  openrouter: boolean;
}

export interface UserSettings {
  systemInstruction: string;
  temperature: number;
  enableThinking: boolean;
  theme: 'dark' | 'light';
  defaultModelId: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  googleClientId?: string;
  customRole?: string;
  geminiApiKey?: string;
  // Free & Local provider configurations
  ollamaHost?: string;
  ollamaModel?: string;
  lmStudioHost?: string;
  lmStudioModel?: string;
  groqApiKey?: string;
  groqModel?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

export interface DiscordBotConfig {
  applicationId: string;
  publicKey: string;
  botToken?: string;
  hasToken: boolean;
  botUsername?: string;
  botAvatar?: string;
  botId?: string;
  verified?: boolean;
  lastConnected?: number;
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: string;
  hasGithubToken: boolean;
}

export type DiscordConfig = DiscordBotConfig;

export interface CustomApiConfig {
  enabled: boolean;
  name: string;
  baseUrl: string;
  apiKey?: string;
  hasApiKey: boolean;
  modelName: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type?: string;
  instructions?: string;
  category: string;
  files: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  githubRepo?: string;
  discordBotEnabled?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
  description: string;
  icon?: string;
  avatar?: string;
  systemPrompt: string;
  category: string;
  tools: string[];
}

