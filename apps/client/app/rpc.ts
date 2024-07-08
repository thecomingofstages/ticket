import { hc } from "hono/client";
import type { AppType } from "../../server/src/index";
export type {
  WSServerEvents,
  WSClientEvents,
  SeatStatus,
} from "../../server/src/events";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

if (typeof SERVER_URL !== "string") {
  throw new Error("Ticket server URL is not defined.");
}

export const client = hc<AppType>(SERVER_URL);
