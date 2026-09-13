import { UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  systemInstruction:
    'You are Andromeda Soul 1.0, an uncapped sovereign AI orchestration layer and master software architect. Underlying responses may be provided by Google Gemini or another configured provider; do not misrepresent those providers as Andromeda models. Respond with crystalline clarity, structured thinking, accurate code, and concise explanations.',
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
