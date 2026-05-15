import { describe, it, expect } from 'vitest';
import { extractMentionIds } from '../../src/modules/notes/utils/mentionParser.js';

describe('extractMentionIds', () => {
  it('should extract a single mention ID correctly', async () => {
    const content = '<p><span class="mention" data-type="mention" data-id="1">@Admin</span></p>';
    const result = await extractMentionIds(content);
    expect(result).toEqual([{id: 1}]);
  });

  it('should extract multiple mention IDs correctly', async () => {
    const content = '<p><span data-type="mention" data-id="1">@User1</span> and <span data-type="mention" data-id="2">@User2</span></p>';
    const result = await extractMentionIds(content);
    expect(result).toEqual([{id: 1}, {id: 2}]);
  });

  it('should handle empty content', async () => {
    const content = '';
    const result = await extractMentionIds(content);
    expect(result).toEqual([]);
  });

  it('should handle content with no mentions', async () => {
    const content = '<p>This is a test without mentions</p>';
    const result = await extractMentionIds(content);
    expect(result).toEqual([]);
  });

  it('should handle null input', async () => {
    const result = await extractMentionIds(null);
    expect(result).toEqual([]);
  });

  it('should handle undefined input', async () => {
    const result = await extractMentionIds(undefined);
    expect(result).toEqual([]);
  });
});