import { WEBSOCKET_EVENTS } from '@the-veil/shared/src/constants';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

type EventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private isConnecting = false;

  constructor() {
    // WebSocket URL should match the API server
    const apiUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : process.env.VITE_API_URL || 'https://veilapi.ogmatrix.net';

    // Convert HTTP(S) URL to WebSocket URL
    this.url = apiUrl.replace(/^http/, 'ws');
  }

  public connect(token: string): void {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.token = token;
    this.isConnecting = true;

    try {
      const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', { timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.emit('disconnected', { code: event.code, reason: event.reason });

        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', { error });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  public send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', type);
    }
  }

  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emit(message.type, message.data);
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (this.token && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.token);
      }
    }, delay);
  }

  // Convenience methods for common events
  public onLaunchStatus(handler: EventHandler): void {
    this.on(WEBSOCKET_EVENTS.LAUNCH_STATUS, handler);
  }

  public onDownloadProgress(handler: EventHandler): void {
    this.on(WEBSOCKET_EVENTS.DOWNLOAD_PROGRESS, handler);
  }

  public onModUpdate(handler: EventHandler): void {
    this.on(WEBSOCKET_EVENTS.MOD_UPDATE, handler);
  }

  public onSystemStatus(handler: EventHandler): void {
    this.on(WEBSOCKET_EVENTS.SYSTEM_STATUS, handler);
  }
}

export const websocketService = new WebSocketService();
