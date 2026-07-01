# Gatekeeper Shell Architecture

Gatekeeper Shell is built around a standard hub-and-spoke real-time architecture using WebSockets. The system consists of two primary components: the **Relay Server** and the **CLI Client**.

## High-Level Flow

1. **Host Connection:** The user hosting the session runs `gatekeeper-shell host`. This initiates a connection to the Relay Server via WebSocket.
2. **Session Creation:** The Relay Server generates a unique 6-character session ID (e.g., `gk-a1b2c3`) and returns it to the Host.
3. **Guest Connection:** A guest user connects to the web interface or runs the CLI command using the session ID. 
4. **Data Streaming:** Once connected, the host's PTY (Pseudo-Terminal) stdout/stderr is streamed through the WebSocket, relayed by the server, and written to the guest's terminal/browser.
5. **Command Execution:** When a guest types a command, it is sent to the Relay Server, forwarded to the Host, and placed in a queue. The Host must explicitly approve the command before it is piped into their local shell's `stdin`.

---

## 1. Relay Server (`cmd/server`)

The Relay Server acts purely as a dumb pipe with session management capabilities. It does **not** execute any shell commands. It is written in Go and uses `gorilla/websocket`.

### Key Responsibilities
- **Session Management:** Creating, tracking, and destroying session rooms.
- **Message Routing:** Broadcasting stdout/stderr from the Host to all connected Guests.
- **Observability:** Exposing `/health` and `/stats` endpoints for monitoring.

---

## 2. CLI Client (`cmd/cli`)

The CLI Client runs on the user's local machine and acts as the bridge between their actual POSIX shell (`bash`, `zsh`, `powershell`) and the Relay Server.

### Key Responsibilities
- **PTY Management:** Wrapping the local shell in a Pseudo-Terminal so that interactive commands (like `vim`, `htop`, or `ssh`) render correctly with ANSI escape codes.
- **WebSocket Communication:** Sending the PTY byte stream to the Relay Server.
- **Command Approval:** Intercepting incoming guest commands and pausing execution to prompt the Host for `[y/N]` approval before sending the bytes to `stdin`.

---

## 3. Web Interface (`web/` & `website/`)

The web interface is a static HTML/CSS/JS single-page application served by the Relay Server or a static host (like GitHub Pages).

### Key Responsibilities
- **Terminal Rendering:** Uses `xterm.js` (or similar) to parse and render the ANSI escape codes received over the WebSocket.
- **Interactive UI:** Provides a clean, dark-mode, glassmorphic UI for guests to view the terminal stream in real-time.
