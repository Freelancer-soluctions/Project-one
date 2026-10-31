import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MentionCountProvider } from './MentionCountProvider';
import { useMentionCount } from './useMentionCount';
import { EVENTS } from '@/services/socketService';

const { socket, useSocket } = vi.hoisted(() => ({
  socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  useSocket: vi.fn(),
}));

vi.mock('@/hooks/useSocket', () => ({ useSocket }));

const wrapper = ({ children }) => (
  <MentionCountProvider>{children}</MentionCountProvider>
);

describe('MentionCountProvider', () => {
  beforeEach(() => {
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    useSocket.mockReturnValue({ socket, isConnected: true });
  });

  it('tracks backlog, new mentions, read events, and removes listeners', () => {
    const { result, unmount } = renderHook(() => useMentionCount(), {
      wrapper,
    });
    const handlers = Object.fromEntries(
      socket.on.mock.calls.map(([event, handler]) => [event, handler])
    );

    expect(socket.emit).toHaveBeenCalledWith('message', {
      type: 'mention:backlog:request',
    });

    act(() =>
      handlers[EVENTS.MENTION_BACKLOG]({ mentions: [{ id: 1 }, { id: 2 }] })
    );
    expect(result.current).toEqual({ unreadCount: 2, isLoaded: true });

    act(() => handlers[EVENTS.MENTION_NEW]());
    expect(result.current.unreadCount).toBe(3);

    act(() => handlers[EVENTS.MENTION_READ]({ mentionIds: [1, 2] }));
    expect(result.current.unreadCount).toBe(1);

    act(() => handlers[EVENTS.MENTION_READ]({}));
    expect(result.current.unreadCount).toBe(0);

    unmount();
    expect(socket.off).toHaveBeenCalledTimes(3);
  });
});
