export type Web3Event<N, T> = {
  event: N;
  address: string;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  returnValues: T;
};

export type EventReactor<Events extends { event: string }> = {
  [T in Events as `on${Capitalize<T['event'] & string>}`]: (event: T) => void;
};

export type EventListenerHandler = {
  onEvent<N extends string, T>(event: Web3Event<N, T>): void;
  onError(error: Error): void;
  onEventChanged(changed: any): void;
  onConnected(message: string): void;
};

export type ContractEventListener = {
  getEvents(): string[];
  setHandler(handler: EventListenerHandler): void
  isListening(): boolean;
  startListening(): void;
  stopListening(): void;
};
