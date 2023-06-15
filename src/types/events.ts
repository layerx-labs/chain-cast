export enum NetworkEventsEnum {
  BOUNTY_CREATED = 'BountyCreated',
  BOUNTY_CANCELED = 'BountyCanceled',
  BOUNTY_FUNDED = 'BountyFunded',
  BOUNTY_CLOSED = 'BountyClosed',
  BOUNTY_PULL_REQUEST_CREATED = 'BountyPullRequestCreated',
  BOUNTY_PULL_REQUEST_READY_FOR_REVIEW = 'BountyPullRequestReadyForReview',
  BOUNTY_PULL_REQUEST_CANCELED = 'BountyPullRequestCanceled',
  BOUNTY_PROPOSAL_CREATED = 'BountyProposalCreated',
  BOUNTY_PROPOSAL_DISPUTED = 'BountyProposalDisputed',
  BOUNTY_PROPOSAL_REFUSED = 'BountyProposalRefused',
  BOUNTY_AMOUNT_UPDATED = 'BountyAmountUpdated',
  ORACLES_CHANGED = 'OraclesChanged',
  ORACLES_TRANSFER = 'OraclesTransfer',
}

export enum RegistryEventsEnum {
  NETWORK_REGISTERED = 'NetworkRegistered',
  NETWORK_CLOSED = 'NetworkClosed',
  USER_LOCKED_AMOUNT_CHANGED = 'UserLockedAmountChanged',
  CHANGED_FEE = 'ChangedFee',
  CHANGE_ALLOWED_TOKENS = 'ChangeAllowedTokens',
  LOCK_FEE_CHANGED = 'LockFeeChanged',
}

export enum POPEventsEnum {
  TRANSFER = 'Transfer',
  APPROVAL = 'Approval',
  APPROVAL_FOR_ALL = 'ApprovalForAll',
}

export type POPTransfer = Web3Event<
  POPEventsEnum.TRANSFER,
  {
    from: string;
    to: string;
    tokenId: number;
  }
>;

export type POPApproval = Web3Event<
  POPEventsEnum.APPROVAL,
  {
    owner: string;
    approved: string;
    tokenId: number;
  }
>;
export type POPApprovalForAll = Web3Event<
  POPEventsEnum.APPROVAL_FOR_ALL,
  {
    owner: string;
    operator: string;
    approved: boolean;
  }
>;

export type POPEventsType = POPTransfer | POPApproval | POPApprovalForAll;

export type NetworkEventsType =
  | NetworkEventsEnum.BOUNTY_CREATED
  | NetworkEventsEnum.BOUNTY_CANCELED
  | NetworkEventsEnum.BOUNTY_FUNDED
  | NetworkEventsEnum.BOUNTY_CLOSED
  | NetworkEventsEnum.BOUNTY_PULL_REQUEST_CREATED
  | NetworkEventsEnum.BOUNTY_PULL_REQUEST_READY_FOR_REVIEW
  | NetworkEventsEnum.BOUNTY_PULL_REQUEST_CANCELED
  | NetworkEventsEnum.BOUNTY_PROPOSAL_CREATED
  | NetworkEventsEnum.BOUNTY_PROPOSAL_DISPUTED
  | NetworkEventsEnum.BOUNTY_PROPOSAL_REFUSED
  | NetworkEventsEnum.BOUNTY_AMOUNT_UPDATED
  | NetworkEventsEnum.ORACLES_CHANGED
  | NetworkEventsEnum.ORACLES_TRANSFER;

export type NetworkEvent =
  | BountyCreated
  | BountyCanceled
  | BountyClosed
  | BountyProposalCreated
  | BountyProposalDisputed
  | BountyProposalRefused
  | BountyPullRequestCanceled
  | BountyPullRequestCreated
  | BountyPullRequestReadyForReview
  | BountyFunded
  | BountyAmountUpdated
  | OraclesChanged
  | OraclesTransfer;

export type RegistryEventsType =
  | RegistryEventsEnum.NETWORK_REGISTERED
  | RegistryEventsEnum.NETWORK_CLOSED
  | RegistryEventsEnum.USER_LOCKED_AMOUNT_CHANGED
  | RegistryEventsEnum.CHANGED_FEE
  | RegistryEventsEnum.CHANGE_ALLOWED_TOKENS
  | RegistryEventsEnum.LOCK_FEE_CHANGED;

export type Web3Event<N, T> = {
  event: N;
  address: string;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  returnValues: T;
};

export type BountyCreated = Web3Event<
  NetworkEventsEnum.BOUNTY_CREATED,
  {
    id: string;
    cid: string;
    creator: string;
  }
>;

export type BountyCanceled = Web3Event<
  NetworkEventsEnum.BOUNTY_CANCELED,
  {
    id: string;
  }
>;

export type BountyClosed = Web3Event<
  NetworkEventsEnum.BOUNTY_CLOSED,
  {
    id: number;
    proposalId: number;
  }
>;

export type BountyProposalCreated = Web3Event<
  NetworkEventsEnum.BOUNTY_PROPOSAL_CREATED,
  {
    bountyId: number;
    prId: number;
    proposalId: number;
  }
>;

export type BountyProposalDisputed = Web3Event<
  NetworkEventsEnum.BOUNTY_PROPOSAL_DISPUTED,
  {
    bountyId: number;
    prId: number;
    proposalId: number;
    weight: number;
    overflow: boolean;
  }
>;
export type BountyProposalRefused = Web3Event<
  NetworkEventsEnum.BOUNTY_PROPOSAL_REFUSED,
  {
    bountyId: number;
    prId: number;
    proposalId: number;
  }
>;
export type BountyPullRequestCanceled = Web3Event<
  NetworkEventsEnum.BOUNTY_PULL_REQUEST_CANCELED,
  {
    bountyId: number;
    pullRequestId: number;
  }
>;
export type BountyPullRequestCreated = Web3Event<
  NetworkEventsEnum.BOUNTY_PULL_REQUEST_CREATED,
  {
    bountyId: number;
    pullRequestId: number;
  }
>;
export type BountyPullRequestReadyForReview = Web3Event<
  NetworkEventsEnum.BOUNTY_PULL_REQUEST_READY_FOR_REVIEW,
  {
    bountyId: number;
    pullRequestId: number;
  }
>;

export type BountyFunded = Web3Event<
  NetworkEventsEnum.BOUNTY_FUNDED,
  {
    id: number;
    funded: boolean;
    benefactor: string;
    amount: number;
  }
>;
export type BountyAmountUpdated = Web3Event<
  NetworkEventsEnum.BOUNTY_AMOUNT_UPDATED,
  {
    id: number;
    amount: number;
  }
>;

export type OraclesChanged = Web3Event<
  NetworkEventsEnum.ORACLES_CHANGED,
  {
    actor: string;
    actionAmount: number;
    newLockedTotal: number;
  }
>;
export type OraclesTransfer = Web3Event<
  NetworkEventsEnum.ORACLES_TRANSFER,
  {
    from: string;
    to: string;
    amount: number;
  }
>;

export type RegistryEvent =
  | NetworkRegistered
  | NetworkClosed
  | UserLockedAmountChanged
  | ChangedFee
  | LockFeeChanged;

export type NetworkRegistered = Web3Event<
  RegistryEventsEnum.NETWORK_REGISTERED,
  {
    network: string;
    creator: string;
    id: number;
  }
>;

export type NetworkClosed = Web3Event<
  RegistryEventsEnum.NETWORK_CLOSED,
  {
    network: string;
  }
>;
export type UserLockedAmountChanged = Web3Event<
  RegistryEventsEnum.USER_LOCKED_AMOUNT_CHANGED,
  {
    user: string;
    newAmount: number;
  }
>;
export type ChangedFee = Web3Event<
  RegistryEventsEnum.CHANGED_FEE,
  {
    closeFee: number;
    cancelFee: number;
  }
>;
export type ChangeAllowedTokens = Web3Event<
  RegistryEventsEnum.CHANGE_ALLOWED_TOKENS,
  {
    tokens: string[];
    operation: string;
    kind: string;
  }
>;
export type LockFeeChanged = Web3Event<
  RegistryEventsEnum.LOCK_FEE_CHANGED,
  {
    lockFee: number;
  }
>;

export type EventReactor<Events extends { event: string }> = {
  [T in Events as `on${Capitalize<T['event'] & string>}`]: (event: T) => void;
};

export type EventListenerProcessor = {
  onEvent<N extends string, T>(event: Web3Event<N, T>): void;
  onError(error: Error): void;
  onEventChanged(changed: any): void;
  onConnected(message: string): void;
};

export type EventListener = {
  getEvents(): string[];
  isListening(): boolean;
  startListening(): void;
  stopListening(): void;
};

export type NetworkEventProcessor = EventReactor<
  | BountyCreated
  | BountyCanceled
  | BountyClosed
  | BountyProposalCreated
  | BountyProposalDisputed
  | BountyProposalRefused
  | BountyPullRequestCanceled
  | BountyPullRequestCreated
  | BountyPullRequestReadyForReview
  | BountyFunded
  | BountyAmountUpdated
  | OraclesChanged
  | OraclesTransfer
>;
export type RegistryEventProcessor = EventReactor<
  NetworkRegistered | NetworkClosed | UserLockedAmountChanged | ChangedFee | LockFeeChanged
>;

export type VariableDict = {[key: string]: any};

export type ProcessorRuntime = {
  name: string;
  filter: string[],
  configuration?: ProcessorConfiguration,
}

export type ProcessorConfiguration = {
  [key: string]: 
    {
      type:  'number'| 'string'| 'boolean' | 'number[]'| 'string[]' | 'date';
      required: boolean | false;
      value: number | string| boolean | number[]| string[] | undefined;
    }    
};

export type EventProcessorCtx = {
  cast: {
    id: string;
    chainId: number;
    address: string;
  },
  variables?: VariableDict,
  steps: ProcessorRuntime[]
  processors: ContractCastEventProcessor[]
  curProcessor: ContractCastEventProcessor
  curStepIndex: number;  
  curStep: ProcessorRuntime
}


export type Variable = {[key: string]: number | string | boolean|  number[]| string[]};

export type ConfigurationFieldType = {
  type:  'number'| 'string'| 'boolean' | 'number[]'| 'string[]' | 'date';
  required: boolean,
}
  

export type ConfigurationTemplate = {
  [key: string]: ConfigurationFieldType;
};

export type ContractCastEventProcessor = {
  name(): string;
  getConfTemplate(): ConfigurationTemplate
  onEvent<N, T>(
    ctx: EventProcessorCtx,
    event: Web3Event<N, T>
  ): void;
};

export type PlugInConstructor<M> = new (id: string, address: string, chainId: number) => M;

export type SupportPlugInsMap = { 
  [key: string]: PlugInConstructor<ContractCastEventProcessor> 
;}

