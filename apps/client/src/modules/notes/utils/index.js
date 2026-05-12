export * from './enums';
export * from './schema';

/**
 * Highlights mentions in content text.
 * Takes mentions data from the API and returns JSX with highlighted mentions.
 *
 * @param {string} content - The note content with @username mentions
 * @param {Array} mentions - Array of mention objects from the API
 * @param {Function} onMentionClick - Optional callback when a mention is clicked
 * @returns {Array} Array of React nodes (text and highlighted spans)
 */
export const highlightMentions = (content, mentions = [], onMentionClick) => {
  if (!content || !mentions || mentions.length === 0) {
    return content;
  }

  // Sort mentions by position to process in order
  const sortedMentions = [...mentions].sort(
    (a, b) => a.positionStart - b.positionStart
  );

  const result = [];
  let lastIndex = 0;

  sortedMentions.forEach((mention) => {
    // Add text before the mention
    if (mention.positionStart > lastIndex) {
      result.push(content.slice(lastIndex, mention.positionStart));
    }

    // Add the highlighted mention
    const mentionText = content.slice(
      mention.positionStart,
      mention.positionEnd
    );

    result.push(
      <span
        key={`mention-${mention.id}`}
        className="text-blue-600 font-medium cursor-pointer hover:underline"
        onClick={(e) => {
          e.preventDefault();
          if (onMentionClick) {
            onMentionClick(mention.mentionedUser);
          }
        }}
        title={`Mentioned: ${mention.mentionedUser?.name || mention.username}`}
      >
        {mentionText}
      </span>
    );

    lastIndex = mention.positionEnd;
  });

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    result.push(content.slice(lastIndex));
  }

  return result;
};