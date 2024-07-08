import { Hono } from "hono";
import { cors } from "hono/cors";
import { createToken, parseToken } from "./token";
import { validateSignature } from "./line/validateSignature";
import { TicketRoom } from "./rooms/ticket";

type Bindings = {
  ENVIRONMENT: string;
  SESSION_SECRET: string;
  TICKET: DurableObjectNamespace<TicketRoom>;
};

const app = new Hono<{ Bindings: Bindings; Variables: { uid: string } }>();

app.get("/", (c) => {
  return c.text("Online");
});

app.post(
  "/line-webhook",
  async (c, next) => {
    try {
      const signature = c.req.header("x-line-signature");
      if (!signature) throw new Error("Signature not found");
      const body = await c.req.arrayBuffer();
      if (!validateSignature(body, c.env.SESSION_SECRET, signature)) {
        throw new Error("Invalid signature");
      }
      return await next();
    } catch (err) {
      console.error(err);
      return new Response("Unauthorized", {
        status: 401,
      });
    }
  },
  (c) => {
    return c.json({ success: true });
  }
);

app.use("/connect", (c, next) =>
  cors({
    origin: c.env.ENVIRONMENT === "development" ? "*" : "https://example.com",
    allowHeaders: ["Authorization"],
  })(c, next)
);

// We need some sort of authorization for websocket connections
// otherwise we might leave a hole of security vulnerability here.
// However, I can't find a proper way to implement it :(
// Cookies and headers are not available in websocket protocol.
//
// So, I pass a token to the URL params to authorize the connection.
// Any connections attempt must have a valid token to connect,
// which is a custom, short-lived token generated by the server.
//
// This token once created can be validated to allow a websocket upgrade
// And the websocket session can be issued and available until the websocket is closed.
//
// In short, send a POST request to /ws/connect to get a token
// before connecting to the websocket.
const appRoute = app.post("/ws/connect", async (c) => {
  // generate a short-lived token for initializing websocket connection
  const token = await createToken(
    {
      uid: Math.random().toString(36).slice(2),
    },
    c.env.SESSION_SECRET
  );
  return c.json({ success: true, token });
});

const wsRoute = appRoute.get("/ws/:token/ticket/:room", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", {
      status: 426,
    });
  }
  const room = c.req.param("room");
  const id = c.env.TICKET.idFromName(room);
  const stub = c.env.TICKET.get(id);
  try {
    const token = c.req.param("token");
    const { uid } = await parseToken(token, c.env.SESSION_SECRET);
    if (!uid) throw new Error("UID Not found");
    const headers = new Headers(c.req.raw.headers);
    headers.append("X-UID", uid);
    return stub.fetch(c.req.raw, {
      headers,
    });
  } catch (err) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
});

export type AppType = typeof wsRoute;

export default app;

export { TicketRoom };
