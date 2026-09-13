import JSZip from 'jszip';

export interface CodeFile {
  path: string;
  content: string;
}

/**
 * Extracts code blocks from markdown text or structured code responses
 * and bundles them into a downloadable ZIP archive.
 */
export async function createZipFromCode(
  rawText: string,
  projectName: string = 'andromeda-project'
): Promise<{ success: boolean; blob?: Blob; filename?: string; fileCount?: number; error?: string }> {
  try {
    const zip = new JSZip();
    const files: CodeFile[] = [];

    // Regex to match markdown code blocks with filename hint or language
    // Formats supported:
    // ```typescript:src/index.ts ... ```
    // ```python file=main.py ... ```
    // // filename: app.js
    // # file: utils.py
    // Regular ```lang ... ```
    const codeBlockRegex = /```(?:([a-zA-Z0-9_-]+)(?::|\s+file=|\s+filename=|\s+path=)?([^\n\r]*))?\n([\s\S]*?)```/g;

    let match;
    let blockIndex = 1;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      const rawLang = (match[1] || 'txt').trim().toLowerCase();
      let pathOrName = (match[2] || '').trim();
      const codeContent = match[3];

      // Check if filename is mentioned in the first comment line
      if (!pathOrName) {
        const firstLine = codeContent.split('\n')[0] || '';
        const commentMatch = firstLine.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:file(?:name)?|path)?:\s*([a-zA-Z0-9_\-\.\/]+)/i);
        if (commentMatch) {
          pathOrName = commentMatch[1].trim();
        }
      }

      // Generate realistic default name if none found
      if (!pathOrName) {
        const ext = getExtensionForLang(rawLang);
        pathOrName = `code_artifact_${blockIndex}.${ext}`;
      }

      // Sanitize path
      const cleanPath = pathOrName.replace(/^\/+/, '');
      files.push({ path: cleanPath, content: codeContent });
      zip.file(cleanPath, codeContent);
      blockIndex++;
    }

    // If no explicit code blocks, save the entire markdown as README.md / prompt_output.md
    if (files.length === 0) {
      zip.file('README.md', rawText);
      files.push({ path: 'README.md', content: rawText });
    }

    // Add a manifest / README
    zip.file('ANDROMEDA_MANIFEST.json', JSON.stringify({
      generator: 'Andromeda Sovereign AI Studio',
      generatedAt: new Date().toISOString(),
      fileCount: files.length,
      files: files.map(f => f.path)
    }, null, 2));

    const contentBlob = await zip.generateAsync({ type: 'blob' });
    const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'andromeda_code';
    const filename = `${cleanProjectName}_${Date.now()}.zip`;

    return {
      success: true,
      blob: contentBlob,
      filename,
      fileCount: files.length,
    };
  } catch (err: any) {
    console.error('Failed to create code ZIP archive:', err);
    return { success: false, error: err.message || 'ZIP generation failed' };
  }
}

/**
 * Downloads a Blob directly in the browser
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getExtensionForLang(lang: string): string {
  switch (lang) {
    case 'typescript':
    case 'ts':
      return 'ts';
    case 'tsx':
      return 'tsx';
    case 'javascript':
    case 'js':
      return 'js';
    case 'jsx':
      return 'jsx';
    case 'python':
    case 'py':
      return 'py';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'bash':
    case 'sh':
    case 'shell':
      return 'sh';
    case 'sql':
      return 'sql';
    case 'rust':
    case 'rs':
      return 'rs';
    case 'go':
      return 'go';
    case 'cpp':
    case 'c++':
      return 'cpp';
    case 'c':
      return 'c';
    case 'java':
      return 'java';
    case 'yaml':
    case 'yml':
      return 'yml';
    default:
      return 'txt';
  }
}
