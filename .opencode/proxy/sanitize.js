export const INJECTION_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?previous/i, severity: 'critical', label: 'ignore-previous' },
  { pattern: /override\s+(the\s+)?(previous|above|original)/i, severity: 'critical', label: 'override' },
  { pattern: /disregard\s+(all\s+)?(above|prior|previous)/i, severity: 'critical', label: 'disregard' },
  { pattern: /\bsystem\s*:/i, severity: 'critical', label: 'system-injection' },
  { pattern: /<\/?(?:system|user|assistant)>/i, severity: 'critical', label: 'role-tags' },
  { pattern: /\*\*(?:CRITICAL|IMPORTANT|MANDATORY|REQUIRED)\*\*/i, severity: 'critical', label: 'authority-framing' },
  { pattern: /\[SYSTEM\]/i, severity: 'critical', label: 'system-bracket' },
  { pattern: /before\s+using\s+this\s+tool/i, severity: 'critical', label: 'cross-tool-before' },
  { pattern: /[\u200B-\u200D\uFEFF\u2060-\u2064\u202A-\u202E]/, severity: 'high', label: 'unicode-invisible' },
  { pattern: /~\/\.(?:ssh|aws|config|gnupg)/i, severity: 'high', label: 'sensitive-path' },
];

export function scanField(text) {
  if (!text || typeof text !== 'string') {
    return { clean: text ?? '', flagged: [] };
  }

  let clean = text;
  const flagged = [];
  
  for (const { pattern, severity, label } of INJECTION_PATTERNS) {
    let match;
    while ((match = pattern.exec(clean)) !== null) {
      flagged.push({ label, severity, index: match.index });
      // Replace the matched pattern with [FILTERED]
      const replacement = '[FILTERED]';
      clean = clean.slice(0, match.index) + replacement + clean.slice(match.index + match[0].length);
      // Reset lastIndex to search from the replacement position
      pattern.lastIndex = match.index + replacement.length;
    }
    // Reset regex lastIndex for next iteration
    pattern.lastIndex = 0;
  }

  return { clean, flagged };
}

export function truncate(text, maxLen = 500) {
  if (!text || typeof text !== 'string') return text ?? '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function sanitizeDescription(description) {
  if (!description || typeof description !== 'string') {
    return { text: description ?? '', truncated: false, flagged: [] };
  }

  const { clean, flagged } = scanField(description);
  const truncated = clean.length > 500;
  const text = truncated ? truncate(clean, 500) : clean;

  return { text, truncated, flagged };
}

export function sanitizeSchemaDescriptions(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSchemaDescriptions(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'description' && typeof value === 'string') {
      const { text, truncated, flagged } = sanitizeDescription(value);
      result[key] = text;
      if (truncated) result._descriptionTruncated = true;
      if (flagged.length > 0) result._descriptionFlagged = flagged;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeSchemaDescriptions(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function sanitizeToolList(tools) {
  if (!Array.isArray(tools)) return [];

  return tools.map(tool => {
    const sanitized = { ...tool };
    if (tool.description) {
      const { text, truncated, flagged } = sanitizeDescription(tool.description);
      sanitized.description = text;
      if (truncated) sanitized._descriptionTruncated = true;
      if (flagged.length > 0) sanitized._descriptionFlagged = flagged;
    }
    if (tool.inputSchema) {
      sanitized.inputSchema = sanitizeSchemaDescriptions(tool.inputSchema);
    }
    return sanitized;
  });
}