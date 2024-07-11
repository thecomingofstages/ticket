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

const parseLocaleDate = (dateString: string) => {
  const [date, time] = dateString.split(" ");
  const [day, month, year] = date.split("/");
  const [hour, minute, seconds] = time.split(":");
  return new Date(
    Number(year) - 543,
    Number(month) - 1,
    Number(day),
    Number(hour) - 7,
    Number(minute),
    Number(seconds)
  ).valueOf();
};

const isArrayEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return a.every((val) => set.has(val));
};

const keysMap = {
  ชื่อ: "name",
  อีเมล: "email",
  เบอร์โทร: "phone",
  ฝ่าย: "department",
  ที่นั่ง: "seats",
  เวลา: "createdAt",
} as const;

const parseTemplate = (template: string, round: string) => {
  const [_, hour, minute] = /(13|18):(00)/.exec(template) ?? [];
  if (round !== `${hour}${minute}`)
    throw new Error(`Invalid round: ${round}. Expected ${hour}${minute}`);
  const lines = template.split("\n");
  const data: Record<string, any> = {};
  lines.slice(2).forEach((line) => {
    const [key, value] = line.split(": ");
    const parsedKey = keysMap[key as keyof typeof keysMap];
    if (!parsedKey) throw new Error(`Invalid key: ${key}`);
    data[parsedKey] =
      parsedKey === "seats"
        ? value.split(", ")
        : parsedKey === "createdAt"
        ? parseLocaleDate(value)
        : value;
  });
  return data as {
    name: string;
    email: string;
    phone: string;
    department: string;
    seats: string[];
    createdAt: number;
  };
};

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

adminTicketApp.get("/:room/users", async (c) => {
  const userData =
    (await c.env.STATE.storage.get<Record<string, Record<string, any>>>(
      "userData"
    )) ?? {};
  return c.json(userData);
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
    const partialUpdate = await c.req.json<Partial<CompleteSession>>();
    if (typeof partialUpdate.createdAt === "string") {
      partialUpdate.createdAt = parseLocaleDate(partialUpdate.createdAt);
      partialUpdate.submittedAt = partialUpdate.createdAt;
    }
    const newSession = merge(session, partialUpdate) as CompleteSession;
    data[id] = newSession;
    await c.env.STATE.storage.put(c.env.STORAGE_KEY, data);
    return c.json({ current: session, updated: newSession });
  });

adminTicketApp.post("/:room/trId/:id/template", async (c) => {
  try {
    const room = c.req.param("room");
    const data = c.get("data");
    const id = c.req.param("id");
    const session = data[id];
    const importTemplate = await c.req.text();
    const {
      seats: parsedSeats,
      createdAt,
      ...user
    } = parseTemplate(importTemplate, room);
    if (!isArrayEqual(parsedSeats, session.seats)) {
      return c.json({
        error: "Seats mismatch",
        current: session,
        seats: parsedSeats,
      });
    }
    const userData =
      (await c.env.STATE.storage.get<Record<string, Record<string, any>>>(
        "userData"
      )) ?? {};

    let hasCreatedUser = false;
    console.log("userData", userData);
    if (!userData[session.uid]) {
      hasCreatedUser = true;
      await c.env.STATE.storage.put("userData", {
        ...userData,
        [session.uid]: {
          uid: session.uid,
          ...user,
        },
      });
    }

    if (!session.createdAt) {
      session.createdAt = createdAt;
      session.submittedAt = createdAt;
    }

    // @ts-expect-error valid?
    session.valid = true;

    await c.env.STATE.storage.put(c.env.STORAGE_KEY, data);
    return c.json({
      user: {
        uid: session.uid,
        ...user,
      },
      hasCreatedUser,
      session,
    });
  } catch (err) {
    return c.json({ error: (err as Error).message });
  }
});

adminTicketApp.put("/:room/mergeUserId", async (c) => {
  const data = c.get("data");
  const trIds = await c.req.json<string[]>();
  // merge all trIds found in the body
  // use the first match user id as the new user id
  const newUserId = trIds.map((trId) => data[trId]?.uid).find((uid) => uid);
  if (!newUserId) return new Response("No user id found", { status: 400 });
  trIds.forEach((trId) => {
    data[trId].uid = newUserId;
  });
  await c.env.STATE.storage.put(c.env.STORAGE_KEY, data);
  return c.json(trIds.map((trId) => data[trId]));
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
