// Stub implementation of @microsoft/signalr for build without the package
export enum HubConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Disconnecting = 'Disconnecting',
  Reconnecting = 'Reconnecting'
}

export class HubConnection {
  state: HubConnectionState = HubConnectionState.Disconnected;
  private handlers: Map<string, Function[]> = new Map();

  on(methodName: string, handler: (...args: any[]) => void): void {
    if (!this.handlers.has(methodName)) {
      this.handlers.set(methodName, []);
    }
    this.handlers.get(methodName)!.push(handler);
  }

  async start(): Promise<void> {
    this.state = HubConnectionState.Connected;
  }

  async stop(): Promise<void> {
    this.state = HubConnectionState.Disconnected;
  }

  async invoke(methodName: string, ...args: any[]): Promise<any> {
    console.log(`SignalR invoke: ${methodName}`, args);
  }
}

export class HubConnectionBuilder {
  private url: string = '';
  private options: any = {};

  withUrl(url: string, options?: any): HubConnectionBuilder {
    this.url = url;
    this.options = options || {};
    return this;
  }

  withAutomaticReconnect(): HubConnectionBuilder {
    return this;
  }

  build(): HubConnection {
    return new HubConnection();
  }
}
