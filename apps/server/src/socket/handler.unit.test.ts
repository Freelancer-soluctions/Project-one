/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock rooms
vi.mock('./rooms.js', () => ({
  joinUserRoom: vi.fn(),
}));

// Mock db
vi.mock('../config/db.js', () => ({
  prisma: {
    mentions: {
      findMany: vi.fn(),
    },
  },
}));

describe('handleConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when no userId', async () => {
    const { handleConnection } = await import('./handler.js');
    const io = {} as any;
    const socket = {
      data: { user: {} },
      recovered: false,
      emit: vi.fn(),
    } as any;
    const getBacklogFn = vi.fn();

    await handleConnection(io, socket, getBacklogFn);

    expect(getBacklogFn).not.toHaveBeenCalled();
  });

  it('joins user room and delivers backlog when not recovered', async () => {
    const { handleConnection } = await import('./handler.js');
    const { joinUserRoom } = await import('./rooms.js');
    const io = {} as any;
    const socket = {
      data: { user: { id: 1 } },
      recovered: false,
      emit: vi.fn(),
    } as any;
    const backlog = [{ id: 1 }];
    const getBacklogFn = vi.fn().mockResolvedValue(backlog);

    await handleConnection(io, socket, getBacklogFn);

    expect(joinUserRoom).toHaveBeenCalledWith(io, socket, 1);
    expect(getBacklogFn).toHaveBeenCalledWith(1);
    expect(socket.emit).toHaveBeenCalledWith('mention:backlog', {
      mentions: backlog,
    });
  });

  it('does not deliver backlog when recovered', async () => {
    const { handleConnection } = await import('./handler.js');
    const io = {} as any;
    const socket = {
      data: { user: { id: 1 } },
      recovered: true,
      emit: vi.fn(),
    } as any;
    const getBacklogFn = vi.fn();

    await handleConnection(io, socket, getBacklogFn);

    expect(getBacklogFn).not.toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does not emit when backlog is empty', async () => {
    const { handleConnection } = await import('./handler.js');
    const io = {} as any;
    const socket = {
      data: { user: { id: 1 } },
      recovered: false,
      emit: vi.fn(),
    } as any;
    const getBacklogFn = vi.fn().mockResolvedValue([]);

    await handleConnection(io, socket, getBacklogFn);

    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does not emit when backlog is null', async () => {
    const { handleConnection } = await import('./handler.js');
    const io = {} as any;
    const socket = {
      data: { user: { id: 1 } },
      recovered: false,
      emit: vi.fn(),
    } as any;
    const getBacklogFn = vi.fn().mockResolvedValue(null);

    await handleConnection(io, socket, getBacklogFn);

    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('handles backlog error gracefully', async () => {
    const { handleConnection } = await import('./handler.js');
    const io = {} as any;
    const socket = {
      data: { user: { id: 1 } },
      recovered: false,
      emit: vi.fn(),
    } as any;
    const getBacklogFn = vi.fn().mockRejectedValue(new Error('DB error'));

    await handleConnection(io, socket, getBacklogFn);

    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('handles socket with no data.user', async () => {
    const { handleConnection } = await import('./handler.js');
    const io = {} as any;
    const socket = { data: {}, recovered: false, emit: vi.fn() } as any;
    const getBacklogFn = vi.fn();

    await handleConnection(io, socket, getBacklogFn);

    expect(getBacklogFn).not.toHaveBeenCalled();
  });
});

describe('getMentionsBacklog', () => {
  it('returns formatted mentions', async () => {
    const { prisma } = await import('../config/db.js');
    const { getMentionsBacklog } = await import('./handler.js');

    const mockMentions = [
      {
        id: 1,
        mentionedByUser: { id: 2, name: 'User2', picture: 'pic.jpg' },
        note: { id: 10, title: 'Test note' },
        createdOn: new Date('2024-01-01'),
      },
    ];

    (prisma.mentions.findMany as any).mockResolvedValue(mockMentions);

    const result = await getMentionsBacklog(1);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(1);
    expect(result[0]!.actor.name).toBe('User2');
    expect(result[0]!.note.title).toBe('Test note');
    expect(result[0]!.excerpt).toBe('Test note');
    expect(result[0]!.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('truncates long titles in excerpt', async () => {
    const { prisma } = await import('../config/db.js');
    const { getMentionsBacklog } = await import('./handler.js');

    const longTitle = 'a'.repeat(150);
    const mockMentions = [
      {
        id: 1,
        mentionedByUser: { id: 2, name: 'User2', picture: null },
        note: { id: 10, title: longTitle },
        createdOn: new Date('2024-01-01'),
      },
    ];

    (prisma.mentions.findMany as any).mockResolvedValue(mockMentions);

    const result = await getMentionsBacklog(1);

    expect(result[0]!.excerpt).toBe('a'.repeat(100) + '...');
  });

  it('returns empty array when no mentions', async () => {
    const { prisma } = await import('../config/db.js');
    const { getMentionsBacklog } = await import('./handler.js');

    (prisma.mentions.findMany as any).mockResolvedValue([]);

    const result = await getMentionsBacklog(1);

    expect(result).toHaveLength(0);
  });

  it('throws on error', async () => {
    const { prisma } = await import('../config/db.js');
    const { getMentionsBacklog } = await import('./handler.js');

    (prisma.mentions.findMany as any).mockRejectedValue(new Error('DB error'));

    await expect(getMentionsBacklog(1)).rejects.toThrow('DB error');
  });
});
