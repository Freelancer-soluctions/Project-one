import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

// Get all .md files in the prompts directory (excluding contracts subdirectory)
function getPromptFiles() {
  const files = fs.readdirSync(PROMPTS_DIR);
  return files
    .filter((f) => f.endsWith('.md') && f !== 'contracts')
    .map((f) => path.join(PROMPTS_DIR, f));
}

const promptFiles = getPromptFiles();

describe('Prompt Hygiene - CRITICAL RULES section', () => {
  // Verify we have all 6 expected prompts (spec-manager and git-manager retired)
  it('should have exactly 6 agent prompt files', () => {
    expect(promptFiles).toHaveLength(6);
    const names = promptFiles.map((f) => path.basename(f, '.md')).sort();
    expect(names).toEqual([
      'developer',
      'orchestrator',
      'planner',
      'project-manager',
      'researcher',
      'reviewer',
    ]);
  });

  for (const filePath of promptFiles) {
    const fileName = path.basename(filePath, '.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    describe(`${fileName}.md`, () => {
      it('(a) contains ## CRITICAL RULES within first ~15 lines', () => {
        const criticalRulesLine = lines.findIndex(
          (line) => line.trim() === '## CRITICAL RULES'
        );
        expect(criticalRulesLine).toBeGreaterThanOrEqual(0);
        expect(criticalRulesLine).toBeLessThan(15);
      });

      it('(b) contains NO # CRITICAL RULES h1 anywhere in the file', () => {
        const h1CriticalRules = lines.some(
          (line) => line.trim() === '# CRITICAL RULES'
        );
        expect(h1CriticalRules).toBe(false);
      });

      it('(c) every ## CRITICAL RULES section contains "Empty responses are NOT acceptable"', () => {
        // Find all ## CRITICAL RULES sections
        const criticalRulesIndices = [];
        lines.forEach((line, idx) => {
          if (line.trim() === '## CRITICAL RULES') {
            criticalRulesIndices.push(idx);
          }
        });

        expect(criticalRulesIndices.length).toBeGreaterThan(0);

        for (const startIdx of criticalRulesIndices) {
          // Find the end of this section (next ## heading or end of file)
          let endIdx = lines.length;
          for (let i = startIdx + 1; i < lines.length; i++) {
            if (lines[i].trim().startsWith('## ')) {
              endIdx = i;
              break;
            }
          }

          const sectionContent = lines.slice(startIdx, endIdx).join('\n');
          expect(sectionContent).toContain(
            'Empty responses are NOT acceptable'
          );
        }
      });
    });
  }
});
