import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./db-schema";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sign, verify } from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
import { and, eq, isNull } from "drizzle-orm";

type Bindings = Env & Record<string, unknown>;

type TokenData = {
  /**
   * [sub] User ID
   */
  sub: string;
  /**
   * [aud] Seat ID
   */
  aud: string;
};

type Variables = {
  db: DrizzleD1Database<typeof schema>;
  data: TokenData;
};

// jwt produces a shorter token than iron
// we don't care about revealing the payload data anyway

export const createCheckInToken = async (
  { aud, sub }: TokenData,
  password: string
) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 5 * 60;
  const payload = {
    aud,
    sub,
    iat,
    exp: exp + 60,
  };
  return { token: await sign(payload, password), exp };
};

export const parseCheckInToken = (token: string, password: string) => {
  return verify(token, password) as Promise<JWTPayload & TokenData>;
};

const checkInApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use("/:token", async (c, next) => {
    try {
      const token = c.req.param("token");
      const data = await parseCheckInToken(token, c.env.HMAC_SECRET);
      if (!data) throw new Error("Invalid data");
      c.set("data", data);
      const db = drizzle(c.env.DB, { schema });
      c.set("db", db);
      return next();
    } catch (err) {
      return c.json({ success: false }, 400);
    }
  })
  .get("/:token", async (c) => {
    const { aud } = c.get("data");
    const db = c.get("db");
    const seat = await db.query.seats.findFirst({
      columns: {
        id: true,
        round: true,
        seat: true,
      },
      where: (s) => and(eq(s.id, aud), isNull(s.checkInAt)),
    });
    if (!seat) return c.json({ success: false }, 400);
    return c.json({ success: true, data: seat }, 200);
  })
  .post(
    "/:token",
    zValidator(
      "json",
      z.object({
        userId: z.string(),
        password: z.string(),
      })
    ),
    async (c) => {
      const form = c.req.valid("json");
      const db = c.get("db");
      const user = await db
        .select()
        .from(schema.staffUsers)
        .where(
          and(
            eq(schema.staffUsers.phone, form.userId),
            eq(schema.staffUsers.password, form.password)
          )
        )
        .limit(1)
        .get();
      if (!user) {
        return c.json({ success: false }, 401);
      }
      try {
        const { aud } = c.get("data");
        const { meta } = await db
          .update(schema.seats)
          .set({ checkInAt: new Date() })
          .where(and(eq(schema.seats.id, aud), isNull(schema.seats.checkInAt)));
        if (meta.rows_written === 0) {
          return c.json(
            { success: false, message: "Seat already checked-in" },
            400
          );
        }
        return c.json({ success: true, seatId: aud } as const, 200);
      } catch (err) {
        return c.json({ success: false, message: "Failed to check-in" }, 500);
      }
    }
  );

export { checkInApp };
