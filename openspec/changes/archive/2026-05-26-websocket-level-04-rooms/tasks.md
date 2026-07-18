## 1. Production Helper Module

- [x] 1.1 Create `apps/server/src/socket/rooms.js` with `joinUserRoom(io, socket, userId)` — joins socket to `user:<userId>` room
- [x] 1.2 Implement `leaveUserRoom(socket, userId)` — leaves `user:<userId>` room
- [x] 1.3 Implement `getActiveUserSockets(io, userId)` — returns all live sockets in `user:<userId>` via `fetchSockets()`
- [x] 1.4 Implement `isUserOnline(io, userId)` — returns boolean based on active sockets count
- [x] 1.5 Implement `getActiveRoomCount(io)` — returns count of rooms matching `user:` prefix
- [x] 1.6 Add full JSDoc annotations to all exported functions

## 2. Standalone Demo Level

- [x] 2.1 Create `apps/server/src/socket/levels/level-05-rooms.js` — standalone server on port 3003
- [x] 2.2 Simulate 3 authenticated users (IDs 5, 7, 42) connecting simultaneously
- [x] 2.3 Demonstrate room isolation — message to user 5 only reaches user 5
- [x] 2.4 Demonstrate multi-tab — user 42 connects twice, both sockets receive room messages
- [x] 2.5 Add every line commented in Spanish explaining each Socket.io room API call
- [x] 2.6 Verify auto-cleanup by logging room state after simulated disconnects

## 3. Documentation

- [x] 3.1 Update `levels/README.md` with room strategy section covering:
      - Room naming convention (`user:<numeric_id>`)
      - When to use `io.to()` vs `io.emit()` vs `socket.broadcast`
      - Multi-tab behavior and implications
      - Prohibition on manual socket ID storage

## 4. Client-side — User room joining

- [x] Update `apps/client/src/hooks/useSocket.js` to join user room:
  - After successful connection, emit 'room:join' with `{ userId }` from Redux store
  - OR listen for 'connect' event and automatically socket.emit('room:join', userId)
  - Store userId from: `useSelector((state) => state.auth.user?.data?.id)`
  - Handle reconnection: re-join room after reconnect

- [x] Verify room joining:
  - Open browser, log in as user A
  - Open second tab, log in as same user A
  - Server should show both tabs in same `user:<id>` room
  - Close one tab → server shows remaining tab still in room
