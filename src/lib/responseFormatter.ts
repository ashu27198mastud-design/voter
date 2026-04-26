import { sanitizeHtml } from './security';

/**
 * Normalizes Gemini/AI responses by converting markdown to safe HTML
 * and removing technical leakage.
 */
export function normalizeAssistantResponse(input: string): string {
  if (!input) return '';

  let normalized = input;

  // 1. Convert Markdown Bold headers to <strong>
  // Matches **Direct answer** and converts to <strong>Direct answer</strong><br />
  normalized = normalized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 2. Convert bullet points starting with - or * into <li>
  // This is a simple implementation for common list patterns
  const lines = normalized.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      let prefix = '';
      if (!inList) {
        prefix = '<ul>';
        inList = true;
      }
      return `${prefix}<li>${content}</li>`;
    } else if (inList && trimmed === '') {
      inList = false;
      return '</ul>';
    } else if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      inList = false;
      return `</ul>${line}`;
    }
    return line;
  });
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  // Clean up bullet point lines to avoid extra <br /> after <li> or <ul> tags
  normalized = processedLines.map(l => l.trim()).filter(l => l !== '').join('\n');
  
  // Convert newlines to <br />, but NOT if they follow a list tag
  normalized = normalized.replace(/\n/g, '<br />');
  normalized = normalized.replace(/<\/li><br \/>/g, '</li>');
  normalized = normalized.replace(/<\/ul><br \/>/g, '</ul>');
  normalized = normalized.replace(/<ul><br \/>/g, '<ul>');

  // 3. Remove raw technical terms
  const technicalTerms = [
    /AI Service Error/gi,
    /503( Service Unavailable)?/gi,
    /Gemini failed/gi,
    /service interruption/gi,
    /stack trace/gi,
    /Internal Server Error/gi,
    /model-not-found/gi
  ];

  technicalTerms.forEach(term => {
    normalized = normalized.replace(term, 'the processing engine');
  });

  // 4. Ensure required headers have breaks if they don't
  const headers = [
    'Direct answer',
    'Key information',
    'What you should do next',
    'Sources / verification'
  ];

  headers.forEach(header => {
    // Matches the header and ensures it's followed by a break or end of string
    const regex = new RegExp(`<strong>${header}<\/strong>\\s*(?!<br\\s*\/?>)`, 'gi');
    normalized = normalized.replace(regex, `<strong>${header}</strong><br />`);
  });

  // 5. Final sanitization
  return sanitizeHtml(normalized);
}
