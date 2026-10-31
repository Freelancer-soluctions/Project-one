import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSocket } from './useSocket';

const { socket, io, dispatch, refreshTokenFecth, logout, state } = vi.hoisted(
  () => {
    const socket = {
      auth: { token: null },
      connected: false,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
    };
    return {
      socket,
      io: vi.fn(() => socket),
      dispatch: vi.fn(),
      refreshTokenFecth: vi.fn(() => ({ type: 'auth/refresh' })),
      logout: vi.fn(() => ({ type: 'auth/logout' })),
      state: { token: 'token-1', userId: 7 },
    };
  }
);

vi.mock('socket.io-client', () => ({ io }));
vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (selector) =>
    selector({
      auth: { user: { data: { accessToken: state.token, id: state.userId } } },
    }),
}));
vi.mock('@/modules/auth/slice/authSlice', () => ({
  refreshTokenFecth,
  logout,
}));

describe('useSocket', () => {
  beforeEach(() => {
    socket.auth.token = null;
    socket.connected = false;
    socket.on.mockClear();
    socket.off.mockClear();
    socket.emit.mockClear();
    socket.connect.mockClear();
    io.mockClear();
    io.mockImplementation(() => socket);
    dispatch.mockClear();
    state.token = 'token-1';
    state.userId = 7;
  });

  it('creates an authenticated socket and updates connection state from events', () => {
    const { result, unmount } = renderHook(() => useSocket());
    const handlers = Object.fromEntries(
      socket.on.mock.calls.map(([event, handler]) => [event, handler])
    );

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'token-1' } })
    );

    act(() => handlers.connect());
    expect(result.current.isConnected).toBe(true);
    expect(socket.emit).toHaveBeenCalledWith('room:join', { userId: 7 });

    act(() => handlers.disconnect('transport close'));
    expect(result.current.isConnected).toBe(false);

    const removedBeforeUnmount = socket.off.mock.calls.length;
    unmount();
    expect(socket.off.mock.calls.length).toBe(removedBeforeUnmount + 3);
  });

  it('does not create a socket for an unauthenticated user', () => {
    state.token = null;

    const { result } = renderHook(() => useSocket());

    expect(io).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('logs out when an unauthorized socket error cannot refresh the token', async () => {
    dispatch.mockReturnValue({
      unwrap: () => Promise.reject(new Error('expired')),
    });
    const { unmount } = renderHook(() => useSocket());
    const onConnectError = socket.on.mock.calls.find(
      ([event]) => event === 'connect_error'
    )[1];

    await act(async () => onConnectError({ message: 'UNAUTHORIZED' }));

    expect(refreshTokenFecth).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/logout' });

    unmount();
  });
});
