export type CqrsOperation =
  | "findAll"
  | "findOne"
  | "create"
  | "update"
  | "delete";

export type CqrsEventType =
  | "query.executed"
  | "command.executed";

export type CqrsEvent = {
  type: CqrsEventType;
  entity: string;
  operation: CqrsOperation;
  payload?: unknown;
};

export type CqrsEventListener = (event: CqrsEvent) => void | Promise<void>;

export type CqrsEventBus = {
  publish: (event: CqrsEvent) => void | Promise<void>;
  subscribe: (listener: CqrsEventListener) => () => void;
};

export type CqrsConfig = {
  enabled?: boolean;
  eventBus?: CqrsEventBus;
};

