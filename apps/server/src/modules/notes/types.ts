import type { Prisma } from '@prisma/client';

/** Note row as stored in the database. */
export type NoteRecord = Prisma.notesGetPayload<object>;

/** Note column (board status) row. */
export type NoteColumnRecord = Prisma.noteColumnsGetPayload<object>;

/** Hashtag row. */
export type HashtagRecord = Prisma.hashtagsGetPayload<object>;

/** Mention row. */
export type MentionRecord = Prisma.mentionsGetPayload<object>;

/** Visibility scope for notes queries. */
export type NoteScope = 'mine' | 'mixed';

/** Hashtag summary attached to a note card. */
export interface NoteHashtagSummary {
  id: number;
  name: string;
}

/** Note row enriched with per-user information for the board. */
export type NoteListItem = NoteRecord & {
  hashtags: NoteHashtagSummary[];
  isFavorited: boolean;
  isOwner: boolean;
  isMentioned: boolean;
  mentionIds: number[];
  hasUnreadMentions: boolean;
};

/** Column with its notes, as returned by the board query. */
export type NoteColumnWithNotes = NoteColumnRecord & {
  notes: NoteListItem[];
};

/** Filters accepted by the board query. */
export interface NotesFilters {
  searchTerm?: string;
  statusCode?: string;
  hashtagIds?: number[];
  userId?: number;
  isFavorite?: boolean;
  scope?: NoteScope;
}

/** Payload used to create a note. */
export interface NoteCreateInput {
  title: string;
  content: string;
  columnId: number;
  hashtagIds?: number[];
  isFavorite?: boolean;
}

/** Column data handed to the insert query. */
export interface NoteCreateData {
  title: string;
  content: string;
  color: string;
  createdOn: Date;
}

/** Payload used to update a note. */
export interface NoteUpdateInput {
  title?: string;
  content?: string;
  columnId?: number;
  hashtagIds?: number[];
  isFavorite?: boolean;
}

/** Mutable column data used internally by the update flow. */
export interface NoteUpdateData {
  title?: string;
  content?: string;
  color?: string;
  columnId?: number;
  hasMentions?: boolean;
  hasUnreadMentions?: boolean;
  updatedOn?: Date;
  isFavorite?: boolean;
}

/** Payload accepted by the DAO update query. */
export type NoteUpdatePayload = Prisma.notesUpdateInput & {
  columnId?: number;
  hashtagIds?: number[];
  isFavorite?: boolean;
};

/** Column data written when a note is moved between columns. */
export interface NoteColumnChangeData {
  columnId: number;
  color: string;
  updatedOn: Date;
}

/** Column change requested by drag-and-drop. */
export interface NoteColumnUpdateInput {
  id: number;
  columnId: number;
}

/** Mention row to persist. */
export interface NoteMentionData {
  noteId: number;
  mentionedUserId: number;
  mentionedByUserId: number;
  createdOn: Date;
}

/** Mention with the involved users' public data. */
export type MentionWithUsers = Prisma.mentionsGetPayload<{
  include: {
    mentionedUser: { select: { id: true; name: true; picture: true } };
    mentionedByUser: { select: { id: true; name: true; picture: true } };
  };
}>;

/** Hashtag row with the number of associated notes. */
export type HashtagWithCount = Prisma.hashtagsGetPayload<{
  include: { _count: { select: { notes: true } } };
}>;

/** Note counts grouped by board column. */
export interface NotesCount {
  backlog: number;
  active: number;
  completed: number;
}

/** Favorite toggle result. */
export interface FavoriteToggleResult {
  isFavorited: boolean;
}

/** A single `@username` occurrence found in plain text. */
export interface ParsedMention {
  username: string;
  positionStart: number;
  positionEnd: number;
}
