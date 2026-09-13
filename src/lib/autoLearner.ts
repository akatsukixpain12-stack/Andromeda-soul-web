import { LearnedKnowledge } from '../types';
import { dbSaveLearnedKnowledge, isUserAuthenticated } from './firebase';

/**
 * Autonomous Google Cloud Continuous Learning Engine
 * 
 * Automatically analyzes completed conversation turns to extract verified facts,
 * user guidelines, coding preferences, and bot configurations, then commits them
 * directly to Google Cloud Firestore without requiring manual user intervention.
 */
export async function autoLearnFromConversationTurn({
  prompt,
  response,
  userId,
  userEmail,
  onKnowledgeLearned,
}: {
  prompt: string;
  response: string;
  userId: string;
  userEmail?: string;
  onKnowledgeLearned?: (item: LearnedKnowledge) => void;
}): Promise<LearnedKnowledge | null> {
  // Discard empty or trivial exchanges
  if (!prompt || !response || prompt.length < 5 || response.length < 20) {
    return null;
  }

  const pLower = prompt.toLowerCase().trim();

  // Determine if this exchange contains high-value learnable information
  const isRuleOrPreference =
    pLower.includes('remember') ||
    pLower.includes('always') ||
    pLower.includes('never') ||
    pLower.includes('i prefer') ||
    pLower.includes('my name is') ||
    pLower.includes('don\'t') ||
    pLower.includes('instruction') ||
    pLower.includes('use tailwind') ||
    pLower.includes('use typescript') ||
    pLower.includes('style:');

  const isDiscordBot =
    pLower.includes('discord') ||
    pLower.includes('bot') ||
    response.includes('discord.js') ||
    response.includes('discord.py') ||
    response.includes('Client(');

  const isCodePattern =
    response.includes('```typescript') ||
    response.includes('```python') ||
    response.includes('```javascript') ||
    pLower.includes('fix the error') ||
    pLower.includes('how to implement');

  // If not a significant learning moment, skip saving noise
  if (!isRuleOrPreference && !isDiscordBot && !isCodePattern && prompt.length < 25) {
    return null;
  }

  let category: 'coding_style' | 'discord_bot' | 'user_preference' | 'general_intelligence' = 'general_intelligence';
  let topic = '';

  if (isRuleOrPreference) {
    category = 'user_preference';
    topic = `User Directive: ${prompt.slice(0, 45).replace(/[#*`_]/g, '')}`;
  } else if (isDiscordBot) {
    category = 'discord_bot';
    topic = `Discord Bot Pattern: ${prompt.slice(0, 45).replace(/[#*`_]/g, '')}`;
  } else if (isCodePattern) {
    category = 'coding_style';
    topic = `Engineering Solution: ${prompt.slice(0, 45).replace(/[#*`_]/g, '')}`;
  } else {
    topic = `Cloud Knowledge: ${prompt.slice(0, 45).replace(/[#*`_]/g, '')}`;
  }

  // Extract concise insight summary from response (first 250 characters of substantive response)
  const cleanResponse = response.replace(/```[\s\S]*?```/g, '[Code Implementation]').trim();
  const insight = `${prompt.slice(0, 100)} ➔ ${cleanResponse.slice(0, 200)}...`;

  const knowledgeItem: LearnedKnowledge = {
    id: `know-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    topic,
    insight,
    category,
    source: 'conversation_learning',
    userId,
    userEmail: userEmail || 'cloud-creator@andromeda.ai',
    createdAt: Date.now(),
    tags: ['conversation-learning', 'google-cloud-sync', category],
  };

  // 1. Direct Cloud Firestore commit
  try {
    if (isUserAuthenticated(userId)) {
      await dbSaveLearnedKnowledge(userId, knowledgeItem);
    }
  } catch (cloudErr) {
    console.warn('[Google Cloud Auto-Learn Sync Notice]:', cloudErr);
  }

  // 2. Secondary server backup commit
  try {
    fetch('/api/cloud/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, knowledge: knowledgeItem }),
    }).catch(() => {});
  } catch {
    // optional backup
  }

  if (onKnowledgeLearned) {
    onKnowledgeLearned(knowledgeItem);
  }

  return knowledgeItem;
}
