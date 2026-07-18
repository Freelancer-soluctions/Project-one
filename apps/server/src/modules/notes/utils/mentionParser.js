import { load } from 'cheerio';

/**
 * Extract user IDs from mentions in HTML content.
 * 
 * This function parses HTML content and extracts all unique user IDs
 * from elements with data-type="mention" attribute.
 * 
 * @param {string} content - HTML content containing mentions
 * @returns {Array<{id: number}>} Array of unique user objects with ID properties mentioned
 * 
 * @example
 * extractMentionIds('<p><span data-type="mention" data-id="1">@User</span></p>')
 * // Returns: [{id: 1}]
 * 
 * @example
 * extractMentionIds('<p><span data-type="mention" data-id="1">@User1</span> and <span data-type="mention" data-id="2">@User2</span></p>')
 * // Returns: [{id: 1}, {id: 2}]
 * 
 * @example
 * extractMentionIds(null)
 * // Returns: []
 */
export const extractMentionIds = async (content) => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const $ = load(content);
  const mentionElements = $('[data-type="mention"]');
  const mentionIds = mentionElements
    .map((_, el) => {
      const id = $(el).data('id');
      return id && !isNaN(id) ? parseInt(id, 10) : null;
    })
    .get()
    .filter(id => id !== null);

  // Remove duplicates by comparing the id values
  const uniqueIds = [...new Set(mentionIds)];
  return uniqueIds.map(id => ({id: id}));
};

/**
 * Parse mentions from plain text content.
 * 
 * This function extracts @username patterns from plain text
 * and returns their username and position information.
 * 
 * @param {string} content - Plain text content
 * @returns {Array<{username: string, positionStart: number, positionEnd: number}>} Array of mention objects
 * 
 * @example
 * parseMentions('Hello @john, how are you?')
 * // Returns: [{username: 'john', positionStart: 6, positionEnd: 11}]
 * 
 * @example
 * parseMentions('@admin please check')
 * // Returns: [{username: 'admin', positionStart: 0, positionEnd: 6}]
 * 
 * @example
 * parseMentions(null)
 * // Returns: []
 */
export const parseMentions = (content) => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      positionStart: match.index,
      positionEnd: match.index + match[0].length,
    });
  }

  return mentions;
};


