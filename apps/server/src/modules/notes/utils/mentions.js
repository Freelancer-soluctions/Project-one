/**
 * Parses the content to extract mentions using @username pattern.
 *
 * @param {string} content - The content to parse for mentions.
 * @returns {Array} An array of objects containing username and position information.
 */
export const parseMentions = (content) => {
  if (!content) return [];

  const mentionRegex = /@(\w+)/g;
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

/**
 * Process mentions when creating or updating a note.
 *
 * @param {string} content - The note content to parse.
 * @param {number} noteId - The ID of the note.
 * @param {number} mentionedByUserId - The ID of the user who created the mention.
 * @returns {Promise<{hasMentions: boolean, mentionsCount: number}>} Result of processing.
 */
export const processMentions = async (content ) => {
  const parsedMentions = parseMentions(content);

  if (parsedMentions.length === 0) {
    return { hasMentions: false, mentionsCount: 0 };
  }

  // // Delete existing mentions for the note (for updates)
  // await prisma.mentions.deleteMany({
  //   where: { noteId },
  // });


  return parsedMentions

  // Process each mention
  const mentionsData = [];
  for (const mention of parsedMentions) {
    const user = await findUserByName(mention.username);
    if (user) {
      mentionsData.push({
        noteId,
        mentionedUserId: user.id,
        mentionedByUserId,
        positionStart: mention.positionStart,
        positionEnd: mention.positionEnd,
      });
    }
  }

  if (mentionsData.length > 0) {
    await prisma.mentions.createMany({
      data: mentionsData,
    });
  }

  return {
    hasMentions: mentionsData.length > 0,
    mentionsCount: mentionsData.length,
  };
};


