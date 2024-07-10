import deepmerge from "@fastify/deepmerge";
import { Hono } from "hono";

export type AdminTicketEnv = {
  Bindings: {
    STATE: DurableObjectState;
    STORAGE_KEY: string;
    ROOM: string;
  };
};

export type CompleteSession = {
  uid: string;
  seats: string[];
  createdAt: number;
  submittedAt: number;
};

const prettifyDate = (session: CompleteSession) => {
  return {
    ...session,
    createdAt: new Date(session.createdAt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    }),
    submittedAt: new Date(session.submittedAt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    }),
  };
};

const merge = deepmerge({
  all: true,
  mergeArray() {
    return (_, source) => {
      // return only unique values
      return Array.from(new Set(source));
    };
  },
});

export type CompleteSessionStorage = Record<string, CompleteSession>;
const adminTicketApp = new Hono<{
  Bindings: AdminTicketEnv["Bindings"];
  Variables: {
    data: CompleteSessionStorage;
  };
}>().basePath("/admin");

adminTicketApp.use(async (c, next) => {
  console.log("adminTicket", c.req.path);
  const data =
    (await c.env.STATE.storage.get<CompleteSessionStorage>(
      c.env.STORAGE_KEY
    )) ?? {};
  c.set("data", data);
  await next();
});

adminTicketApp.get("/:room", async (c) => {
  return c.json(c.get("data"));
});

adminTicketApp
  .get("/:room/trId/:id", async (c) => {
    const data = c.get("data");
    const id = c.req.param("id");
    const session = data[id];
    if (!session) return new Response("Session not found", { status: 404 });
    return c.json(session);
  })
  .post(async (c) => {
    const data = c.get("data");
    const id = c.req.param("id");
    const session = data[id];
    const partialUpdate = await c.req.json();
    const newSession = merge(session, partialUpdate);
    data[id] = newSession;
    await c.env.STATE.storage.put(c.env.STORAGE_KEY, data);
    return c.json({ current: session, updated: newSession });
  });

const adminTicket = adminTicketApp.get("/:room/seat/:seat", async (c) => {
  const data = c.get("data");
  const seat = c.req.param("seat");
  if (!seat) return new Response("Invalid seat", { status: 400 });
  const baseUrl = c.req.url.split("/seat")[0];
  const sessions = Object.entries(data)
    .filter(([, session]) => session.seats.includes(seat))
    .map(([id, session]) => [
      id,
      {
        session: prettifyDate(session),
        url: `${baseUrl}/trId/${id}`,
      },
    ]);
  return c.json(Object.fromEntries(sessions));
});

export { adminTicket };
