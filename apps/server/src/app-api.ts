import { Hono } from "hono";

import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { seats, transactions } from "./db-schema";
import { cors } from "hono/cors";
import { decode, verify } from "hono/jwt";
import { eq } from "drizzle-orm";
import { getJwk } from "./line/get-jwk";
import { TokenHeader } from "hono/utils/jwt/jwt";
import { JWTPayload } from "hono/utils/jwt/types";

type Bindings = Env & Record<string, unknown>;

type Variables = {
  uid: string;
  db: DrizzleD1Database;
};

const apiApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use(
    (c, next) =>
      cors({
        origin: c.env.CORS_ALLOW_ORIGIN,
        allowHeaders: ["Authorization"],
      })(c, next),
    async (c, next) => {
      const [type, token] = c.req.header("Authorization")?.split(" ") ?? [];
      if (type !== "Bearer") return c.json({ success: false }, 401);
      // parse JWK kid from the token without validating it
      const { header, payload: p } = decode(token) as {
        header: TokenHeader & { kid?: string };
        payload: JWTPayload;
      };
      if (
        header.alg === "ES256" &&
        header.typ === "JWT" &&
        typeof header.kid === "string"
      ) {
        try {
          const key = await getJwk(header.kid);
          const { sub } = (await verify(token, key, "ES256")) as JWTPayload & {
            sub: string;
          };
          c.set("uid", sub);
          return await next();
        } catch (err) {
          console.error(err);
          return c.json({ success: false }, 401);
        }
      }
      return c.json({ success: false }, 500);
    },
    async (c, next) => {
      c.set("db", drizzle(c.env.DB));
      await next();
    }
  )
  .get("/ticket", async (c) => {
    const db = c.get("db");
    // todo: get uid from the token
    const uid = "z1gqxizy0c";
    const data = await db
      .select()
      .from(transactions)
      .leftJoin(seats, eq(seats.transactionId, transactions.id))
      .where(eq(transactions.uid, uid))
      .all();
    if (data.length === 0) return c.json({ success: false }, 400);
    const transaction = data[0].transactions;
    const seatsData = data.map((d) => d.seats);
    return c.json({ success: true, data: { transaction, seats: seatsData } });
  });

export { apiApp };
