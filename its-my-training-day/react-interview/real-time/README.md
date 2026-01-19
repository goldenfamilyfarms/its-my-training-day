# Real-Time WebSocket Integration - Interview Deep Dive

Production-ready patterns for WebSocket integration in React applications, covering connection management, reconnection strategies, and message handling.

## 🎯 Overview

Real-time features are critical for GRC/compliance applications:
- **Control status updates**: Stream compliance control states
- **Alert notifications**: Immediate critical alerts
- **Collaborative editing**: Multiple users editing policies
- **Live dashboards**: Real-time metrics and KPIs

## 📁 Implementation

### 01-websocket-custom-hooks.tsx
**Complexity**: ⭐⭐⭐⭐⭐
**Interview Focus**: Custom hooks, Connection management, Error handling, Message queuing

---

## 🔍 Deep Technical Analysis

### 1. WebSocket vs Alternatives

**Decision Matrix**:

| Feature | Polling | Long Polling | SSE | WebSocket |
|---------|---------|--------------|-----|-----------|
| Latency | High (500ms+) | Medium (100ms) | Low (50ms) | Lowest (10ms) |
| Server Load | Very High | High | Medium | Low |
| Bidirectional | ✅ | ✅ | ❌ | ✅ |
| Browser Support | ✅ All | ✅ All | ⚠️ No IE | ✅ Modern |
| Complexity | Simple | Medium | Simple | Complex |
| Firewall/Proxy | ✅ Works | ✅ Works | ✅ Works | ⚠️ May block |

**When to use WebSocket**:
- ✅ Need bidirectional communication
- ✅ High-frequency updates (> 1/second)
- ✅ Low latency critical (< 100ms)
- ✅ Many concurrent connections

**When to use SSE**:
- ✅ One-way server → client only
- ✅ Simpler implementation
- ✅ Automatic reconnection built-in
- ✅ Works through more proxies

**When to use Polling**:
- ✅ Infrequent updates (< 1/minute)
- ✅ Simple requirements
- ✅ REST API already exists

---

### 2. Automatic Reconnection Strategy

**Problem**: WebSocket connections drop frequently

```typescript
// ❌ BAD: No reconnection
const ws = new WebSocket('ws://api.example.com');
// Connection drops → User sees stale data → Bad UX
```

**Solution**: Exponential backoff reconnection

```typescript
// ✅ GOOD: Automatic reconnection with backoff
function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Connected');
      reconnectAttempts.current = 0; // Reset on successful connection
    };

    ws.onclose = (event) => {
      console.log('Disconnected:', event.code, event.reason);

      // Calculate backoff delay: 1s, 2s, 4s, 8s, ..., max 30s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;

      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect(); // Recursive reconnection
      }, delay);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close(); // Trigger reconnection via onclose
    };

    wsRef.current = ws;
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
```

**Exponential Backoff Benefits**:
- Attempt 1: 1 second delay (quick retry)
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5+: 30 seconds (capped)

**Why exponential**:
- ✅ Quick recovery from transient failures
- ✅ Reduces server load during outages
- ✅ Industry standard pattern

#### Interview Question: Reconnection Strategy

**Q: Why use exponential backoff instead of fixed intervals?**
A: "Exponential backoff solves two problems:

1. **Transient failures**: Quick initial retry (1s) catches brief network blips
2. **Sustained outages**: Longer delays prevent hammering the server

With fixed 1s intervals:
- ❌ Server recovering from crash gets 1000 reconnection attempts/second
- ❌ DDoS-like behavior during outages

With exponential backoff:
- ✅ Server gets breathing room to recover
- ✅ Client still reconnects reasonably fast
- ✅ Graceful degradation

I cap at 30 seconds to balance server load with user experience."

---

### 3. Heartbeat / Ping-Pong Pattern

**Problem**: Dead connections not detected

```typescript
// Network interruption → Connection appears open but is dead
// No data flows, but no error event fires
// User sees stale data for minutes
```

**Solution**: Heartbeat mechanism

```typescript
function useWebSocketWithHeartbeat(url: string) {
  const ws = useWebSocket(url);
  const pingIntervalRef = useRef<number | null>(null);
  const pongTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    // Send ping every 30 seconds
    pingIntervalRef.current = window.setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));

        // Expect pong within 5 seconds
        pongTimeoutRef.current = window.setTimeout(() => {
          console.warn('Pong timeout, closing connection');
          ws.current?.close(); // Force reconnection
        }, 5000);
      }
    }, 30000);

    // Handle pong response
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'pong') {
        clearTimeout(pongTimeoutRef.current!); // Pong received, cancel timeout
      } else {
        // Handle normal messages
        handleMessage(message);
      }
    };

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
    };
  }, [ws]);

  return ws;
}
```

**Timing Considerations**:
- **Ping interval**: 30s (balance responsiveness vs bandwidth)
- **Pong timeout**: 5s (account for network latency)
- **Total detection time**: 30s + 5s = 35s max to detect dead connection

#### Interview Question: Heartbeat Pattern

**Q: Why implement heartbeat if TCP already has keep-alive?**
A: "TCP keep-alive has limitations:

1. **Not application-aware**: Checks connection, not if server is processing
2. **Long timeouts**: Default is 2 hours (too slow)
3. **Platform-specific**: Different OS defaults
4. **Proxy issues**: Proxies may swallow keep-alive packets

Application-level heartbeat provides:
- ✅ Fast detection (30-60 seconds)
- ✅ Application-level health check
- ✅ Consistent across platforms
- ✅ Works through proxies

```typescript
// TCP keep-alive: Connection ok, but server hung
Server: HTTP 200 → TCP connected → No messages (application dead)

// App heartbeat: Detects application failure
Client: ping → No pong → Close connection → Reconnect
```"

---

### 4. Message Queuing During Disconnection

**Problem**: Messages sent while disconnected are lost

```typescript
// ❌ BAD: Lost messages
function sendMessage(message: Message) {
  ws.send(JSON.stringify(message)); // Fails if disconnected
}
```

**Solution**: Queue messages, flush on reconnection

```typescript
// ✅ GOOD: Queued messages
function useWebSocketWithQueue(url: string) {
  const ws = useWebSocket(url);
  const messageQueue = useRef<Message[]>([]);

  const sendMessage = useCallback((message: Message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      // Queue message for later
      messageQueue.current.push(message);
      console.log('Message queued (disconnected)');
    }
  }, [ws]);

  useEffect(() => {
    if (ws.current?.readyState === WebSocket.OPEN && messageQueue.current.length > 0) {
      console.log(`Flushing ${messageQueue.current.length} queued messages`);

      messageQueue.current.forEach(message => {
        ws.current!.send(JSON.stringify(message));
      });

      messageQueue.current = [];
    }
  }, [ws.current?.readyState]);

  return { ws, sendMessage };
}
```

**Advanced**: Add message acknowledgment

```typescript
interface QueuedMessage {
  id: string;
  message: Message;
  timestamp: number;
  retries: number;
}

const pendingMessages = useRef<Map<string, QueuedMessage>>(new Map());

function sendMessage(message: Message) {
  const id = generateId();
  const queuedMessage = { id, message, timestamp: Date.now(), retries: 0 };

  pendingMessages.current.set(id, queuedMessage);

  ws.send(JSON.stringify({ id, ...message }));

  // Set timeout for acknowledgment
  setTimeout(() => {
    if (pendingMessages.current.has(id)) {
      // No ack received, retry
      retryMessage(id);
    }
  }, 5000);
}

function handleAck(messageId: string) {
  pendingMessages.current.delete(messageId); // Message delivered successfully
}
```

---

### 5. Type-Safe Message Handling

**Pattern**: Discriminated unions for messages

```typescript
type WebSocketMessage =
  | { type: 'control_update'; data: { controlId: string; status: string } }
  | { type: 'alert'; data: { level: string; message: string } }
  | { type: 'user_joined'; data: { userId: string; name: string } }
  | { type: 'pong' };

function handleMessage(event: MessageEvent) {
  const message: WebSocketMessage = JSON.parse(event.data);

  switch (message.type) {
    case 'control_update':
      // TypeScript knows: message.data has controlId and status
      updateControl(message.data.controlId, message.data.status);
      break;

    case 'alert':
      // TypeScript knows: message.data has level and message
      showAlert(message.data.level, message.data.message);
      break;

    case 'user_joined':
      // TypeScript knows: message.data has userId and name
      addUser(message.data.userId, message.data.name);
      break;

    case 'pong':
      clearTimeout(pongTimeout);
      break;

    default:
      // Exhaustiveness check: TypeScript ensures all cases handled
      const _exhaustive: never = message;
      console.warn('Unknown message type:', _exhaustive);
  }
}
```

---

### 6. React Hook API Design

**Good API**: Simple, composable, testable

```typescript
// ✅ GOOD: Clean hook API
function ComplianceMonitor() {
  const {
    data,
    sendMessage,
    isConnected,
    error,
  } = useWebSocket<ControlUpdate>('ws://api.example.com/controls', {
    onMessage: (message) => {
      if (message.type === 'control_update') {
        updateControlStatus(message.data);
      }
    },
    onError: (error) => {
      logError('WebSocket error', error);
    },
    reconnect: true,
    heartbeat: { interval: 30000, timeout: 5000 },
  });

  return (
    <div>
      <StatusIndicator connected={isConnected} error={error} />
      <ControlList data={data} onUpdate={sendMessage} />
    </div>
  );
}
```

**Features**:
- ✅ Type-safe messages with generics
- ✅ Configurable reconnection
- ✅ Optional heartbeat
- ✅ Clear connection status
- ✅ Error handling
- ✅ Message callbacks

---

## 🎓 Study Strategy

### Must Know

1. **WebSocket vs alternatives** (polling, SSE)
2. **Exponential backoff** reconnection
3. **Heartbeat pattern** for dead connection detection
4. **Message queuing** during disconnection
5. **Type-safe** message handling

### Practice Explaining

"For real-time compliance monitoring, I implemented a custom WebSocket hook with:

1. **Automatic reconnection** using exponential backoff (1s, 2s, 4s, capped at 30s)
2. **Heartbeat mechanism** to detect dead connections (ping every 30s, expect pong in 5s)
3. **Message queuing** to buffer messages sent while disconnected
4. **Type-safe message handling** using discriminated unions

This ensures users always have up-to-date compliance data with graceful degradation during network issues."

---

## 🔑 Key Patterns

- ✅ Exponential backoff: 1s, 2s, 4s, 8s, ..., 30s max
- ✅ Heartbeat: ping every 30s, timeout after 5s
- ✅ Message queue: buffer during disconnection
- ✅ Connection status UI: show connection state
- ✅ Type-safe messages: discriminated unions

---

Good luck with your Adobe TechGRC interview! 🚀
