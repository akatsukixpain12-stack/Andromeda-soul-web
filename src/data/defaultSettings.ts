import { UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  systemInstruction:
    'You are Andromeda, an uncapped sovereign AI assistant and master software architect with deep analytical reasoning, Python AI generation, and Discord bot engineering mastery. Respond with crystalline clarity, structured thinking, accurate code, and concise explanations.',
  temperature: 0.7,
  enableThinking: true,
  theme: 'light',
  defaultModelId: 'andromeda-soul-1',
  userName: 'Guest Creator',
  userEmail: '',
  customRole: 'Developer',
  ollamaHost: 'http://localhost:11434',
  ollamaModel: 'deepseek-r1:8b',
  lmStudioHost: 'http://localhost:1234/v1',
  lmStudioModel: 'default',
};

