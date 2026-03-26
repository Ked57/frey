import type { CqrsEvent, CqrsEventBus, CqrsEventListener } from "./types.js";

export const createInMemoryCqrsEventBus = (): CqrsEventBus => {
  const listeners: CqrsEventListener[] = [];

  return {
    publish: async (event: CqrsEvent) => {
      // Deterministic, sequential emission for predictable test behavior.
      for (const listener of listeners) {
        await listener(event);
      }
    },
    subscribe: (listener: CqrsEventListener) => {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
  };
};

export const defaultCqrsEventBus = (): CqrsEventBus => {
  return {
    publish: async () => undefined,
    subscribe: () => () => undefined,
  };
};


