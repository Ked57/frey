import type { CqrsEvent, CqrsEventBus } from "./types.js";

// Minimal v3-slice state so route modules can publish CQRS events
// without requiring a larger refactor of the route registration API.
let cqrsEventBus: CqrsEventBus | undefined;

export const setCqrsEventBus = (bus: CqrsEventBus | undefined) => {
  cqrsEventBus = bus;
};

export const publishCqrsEvent = async (
  event: CqrsEvent,
): Promise<void> => {
  await cqrsEventBus?.publish(event);
};

export const getCqrsEventBus = (): CqrsEventBus | undefined => cqrsEventBus;

