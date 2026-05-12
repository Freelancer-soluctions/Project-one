import { describe, it, expect } from 'vitest';
import { parseMentions } from '../../src/modules/notes/service.js';

describe('parseMentions', () => {
  it('should return empty array for null content', () => {
    expect(parseMentions(null)).toEqual([]);
  });

  it('should return empty array for undefined content', () => {
    expect(parseMentions(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(parseMentions('')).toEqual([]);
  });

  it('should return empty array when no mentions exist', () => {
    const content = 'This is a note without any mentions';
    expect(parseMentions(content)).toEqual([]);
  });

  it('should parse a single mention', () => {
    const content = 'Hello @john, how are you?';
    const mentions = parseMentions(content);

    expect(mentions).toHaveLength(1);
    expect(mentions[0]).toEqual({
      username: 'john',
      positionStart: 6,
      positionEnd: 11,
    });
  });

  it('should parse multiple mentions', () => {
    const content = 'Hey @alice and @bob, please review this note';
    const mentions = parseMentions(content);

    expect(mentions).toHaveLength(2);
    expect(mentions[0]).toEqual({
      username: 'alice',
      positionStart: 4,
      positionEnd: 10,
    });
    expect(mentions[1]).toEqual({
      username: 'bob',
      positionStart: 15,
      positionEnd: 19,
    });
  });

  it('should handle mentions at the start of content', () => {
    const content = '@admin please check this';
    const mentions = parseMentions(content);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].username).toBe('admin');
    expect(mentions[0].positionStart).toBe(0);
  });

  it('should handle mentions at the end of content', () => {
    const content = 'Check with @admin';
    const mentions = parseMentions(content);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].username).toBe('admin');
    expect(mentions[0].positionEnd).toBe(content.length);
  });

  it('should handle consecutive mentions', () => {
    const content = '@user1@user2';
    const mentions = parseMentions(content);

    expect(mentions).toHaveLength(2);
    expect(mentions[0].username).toBe('user1');
    expect(mentions[1].username).toBe('user2');
  });

  it('should handle usernames with numbers', () => {
    const content = 'Contact @user123 for help';
    const mentions = parseMentions(content);

    expect(mentions).toHaveLength(1);
    expect(mentions[0].username).toBe('user123');
  });
});