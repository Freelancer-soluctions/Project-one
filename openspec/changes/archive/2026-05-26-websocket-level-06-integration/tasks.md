## 1. Core Bus Module

- [x] 1.1 Create `apps/server/src/socket/notificationBus.js` with a singleton EventEmitter instance, setMaxListeners(50), exported event name constants (`MENTION_CREATED`, `MENTION_READ`), and an exported `getBus()` function — all fully JSDoc-documented

## 2. Integration Demo Server

- [x] 2.1 Create `apps/server/src/socket/levels/level-07-integration.js` as a standalone server on port 3005 that simulates the full mention flow (HTTP controller → service → in-memory store → notificationBus emit → socket handler → room delivery), with every line commented in Spanish explaining why EventEmitter (decoupling, testability), the flow (controller → service → bus → socket), and error isolation between layers

## 3. Documentation

- [x] 3.1 Update `apps/server/src/socket/README.md` with an ASCII architecture diagram of the EventEmitter bus, a section explaining why decoupling between service and socket layers matters, and the testing strategy (mock the bus, not Socket.IO)
