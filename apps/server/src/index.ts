import { Hono } from "hono";
import { cors } from "hono/cors";
import { createToken, parseToken } from "./token";
import { validateSignature } from "./line/validateSignature";
import { TicketRoom } from "./rooms/ticket";
import { bearerAuth } from "hono/bearer-auth";
import { apiApp } from "./app-api";
import { checkInApp } from "./app-checkin";

type Bindings = Env & Record<string, unknown>;

type Variables = {
  uid: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .route("/api", apiApp)
  .route("/checkIn", checkInApp);

app.get("/", async (c) => {
  return c.json({ success: true });
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

app.on(
  ["GET", "PUT", "POST", "DELETE"],
  ["/admin/:room", "/admin/:room/*"],
  (c, next) => bearerAuth({ token: c.env.SESSION_SECRET })(c, next),
  (c) => {
    const room = c.req.param("room");
    if (!room) return new Response("Room not found", { status: 404 });
    console.log("Enter admin zone.");
    const id = c.env.TICKET.idFromName(room);
    const stub = c.env.TICKET.get(id);
    return stub.fetch(c.req.raw);
  }
);

app.use("/ws/connect", (c, next) =>
  cors({
    origin: c.env.CORS_ALLOW_ORIGIN,
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
