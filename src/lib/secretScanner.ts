/**
 * Smart Secret Scanner for Andromeda
 * Detects sensitive credentials, API keys, private keys, and tokens
 * before they can be committed, pushed to GitHub, or leaked.
 */

export interface SecretFinding {
  type: string;
  label: string;
  file?: string;
  line?: number;
  matchSnippet: string;
  severity: 'critical' | 'warning';
}

export interface ScanResult {
  hasSecrets: boolean;
  criticalCount: number;
  warningCount: number;
  findings: SecretFinding[];
  summaryMessage: string;
}

const SECRET_PATTERNS: Array<{
  type: string;
  label: string;
  regex: RegExp;
  severity: 'critical' | 'warning';
}> = [
  {
    type: 'discord_token',
    label: 'Discord Bot Token',
    regex: /[MN][A-Za-z\d]{23,28}\.[\w-]{6}\.[\w-]{27,38}/g,
    severity: 'critical',
  },
  {
    type: 'gemini_api_key',
    label: 'Google Gemini API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
    severity: 'critical',
  },
  {
    type: 'openai_api_key',
    label: 'OpenAI-style API Key',
    regex: /sk-(?:proj-|live-)?[A-Za-z0-9_-]{20,}/g,
    severity: 'critical',
  },
  {
    type: 'github_pat',
    label: 'GitHub Personal Access Token',
    regex: /(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})/g,
    severity: 'critical',
  },
  {
    type: 'private_key',
    label: 'Cryptographic Private Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PRIVATE )KEY[^-]+-----END/gs,
    severity: 'critical',
  },
  {
    type: 'aws_key',
    label: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
  },
  {
    type: 'hardcoded_secret',
    label: 'Hardcoded Secret Assignment',
    regex: /(?:password|secret|api_key|token|bot_token)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{12,})['"]/gi,
    severity: 'warning',
  },
];

// Helper to mask secret characters
export function maskSecretSnippet(str: string): string {
  if (!str) return '';
  if (str.length <= 8) return '••••••••';
  const start = str.slice(0, 4);
  const end = str.slice(-4);
  return `${start}••••••••${end}`;
}

// Calculate Shannon entropy for high-randomness string detection
function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Scans a single text content for secrets
 */
export function scanTextForSecrets(text: string, filename?: string): SecretFinding[] {
  if (!text) return [];
  const findings: SecretFinding[] = [];
  const lines = text.split('\n');

  // Skip dummy placeholders
  const isPlaceholder = (val: string) => {
    const lower = val.toLowerCase();
    return (
      lower.includes('your_') ||
      lower.includes('your-') ||
      lower.includes('placeholder') ||
      lower.includes('example') ||
      lower.includes('demo') ||
      lower.includes('••••••••') ||
      lower.includes('insert_')
    );
  };

  for (const pattern of SECRET_PATTERNS) {
    // Reset regex index
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(text)) !== null) {
      const matchVal = match[0];
      if (isPlaceholder(matchVal)) continue;

      // Find line number
      const charIndex = match.index;
      let lineNum = 1;
      let count = 0;
      for (const line of lines) {
        count += line.length + 1;
        if (count > charIndex) break;
        lineNum++;
      }

      findings.push({
        type: pattern.type,
        label: pattern.label,
        file: filename,
        line: lineNum,
        matchSnippet: maskSecretSnippet(matchVal),
        severity: pattern.severity,
      });
    }
  }

  // Scan for suspicious high-entropy tokens on individual lines
  lines.forEach((line, idx) => {
    // Check tokens with 32+ characters without spaces
    const words = line.split(/[\s,"'`=:]+/);
    for (const word of words) {
      if (word.length >= 32 && /^[a-zA-Z0-9_\-\.\/]{32,}$/.test(word)) {
        if (!isPlaceholder(word)) {
          const entropy = calculateEntropy(word);
          if (entropy > 4.5) {
            findings.push({
              type: 'high_entropy_string',
              label: 'High-Entropy Secret String',
              file: filename,
              line: idx + 1,
              matchSnippet: maskSecretSnippet(word),
              severity: 'warning',
            });
          }
        }
      }
    }
  });

  return findings;
}

/**
 * Scans a multi-file collection (e.g. project files before GitHub push)
 */
export function scanFilesForSecrets(files: Record<string, string>): ScanResult {
  const allFindings: SecretFinding[] = [];

  for (const [filename, content] of Object.entries(files)) {
    // Flag if user tries to commit .env directly
    if (filename === '.env' || filename.endsWith('/.env')) {
      allFindings.push({
        type: 'env_file_detected',
        label: 'Plaintext .env File in Repository Structure',
        file: filename,
        line: 1,
        matchSnippet: '.env containing private secrets',
        severity: 'critical',
      });
    }

    const fileFindings = scanTextForSecrets(content, filename);
    allFindings.push(...fileFindings);
  }

  const criticalCount = allFindings.filter((f) => f.severity === 'critical').length;
  const warningCount = allFindings.filter((f) => f.severity === 'warning').length;
  const hasSecrets = criticalCount > 0;

  let summaryMessage = 'No secrets detected. Project safe to deploy.';
  if (criticalCount > 0) {
    summaryMessage = `Potential secret detected. This file cannot be pushed until the secret is removed or explicitly handled through a secure environment variable. (${criticalCount} critical finding(s))`;
  } else if (warningCount > 0) {
    summaryMessage = `Notice: ${warningCount} suspicious high-entropy pattern(s) identified. Review before publishing.`;
  }

  return {
    hasSecrets,
    criticalCount,
    warningCount,
    findings: allFindings,
    summaryMessage,
  };
}
