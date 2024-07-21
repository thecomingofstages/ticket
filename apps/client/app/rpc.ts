import { hc } from "hono/client";
import type { AppType } from "../../server/src/index";
export type {
  WSServerEvents,
  WSClientEvents,
  SeatStatus,
} from "../../server/src/events";
import { liff } from "./lib/liff";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

if (typeof SERVER_URL !== "string") {
  throw new Error("Ticket server URL is not defined.");
}

export const client = hc<AppType>(SERVER_URL, {
  async fetch(
    input: string | Request | URL,
    init: RequestInit<CfProperties<unknown>> | undefined
  ) {
    const authToken = liff.getIDToken();
    const headers = new Headers(
      typeof init === "object" ? init.headers : undefined
    );
    if (authToken) {
      headers.append("Authorization", `Bearer ${authToken}`);
    } else if (input.toString().includes("/api")) {
      throw new Error("Unauthorized");
    }
    return fetch(input, {
      ...init,
      headers,
    });
  },
});
