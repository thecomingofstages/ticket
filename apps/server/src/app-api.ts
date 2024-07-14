import { Hono } from "hono";

import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./db-schema";
import { cors } from "hono/cors";
import { decode, verify } from "hono/jwt";
import { eq } from "drizzle-orm";
import { getJwk } from "./line/get-jwk";
import { TokenHeader } from "hono/utils/jwt/jwt";
import { JWTPayload } from "hono/utils/jwt/types";

type Bindings = Env & Record<string, unknown>;

type LineIdToken = JWTPayload & {
  sub: string;
  name: string;
  picture: string;
};

type Variables = {
  providerUser: LineIdToken;
  db: DrizzleD1Database<typeof schema>;
  user: schema.User | null;
};

type ProfileEndpoint = {
  providerUser: Pick<LineIdToken, "sub" | "name" | "picture">;
  data?: Omit<schema.User, "lineUid" | "verified">;
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
      const { header } = decode(token) as {
        header: TokenHeader & { kid?: string };
      };
      if (
        header.alg === "ES256" &&
        header.typ === "JWT" &&
        typeof header.kid === "string"
      ) {
        try {
          const key = await getJwk(header.kid);
          const data = (await verify(token, key, "ES256")) as LineIdToken;
          c.set("providerUser", data);
          // fetch native user from db
          const db = drizzle(c.env.DB, { schema });
          c.set("db", db);
          const user = await db.query.users.findFirst({
            where: (users) => eq(users.lineUid, data.sub),
          });
          c.set("user", user ?? null);
          return await next();
        } catch (err) {
          console.error(err);
          return c.json({ success: false }, 401);
        }
      }
      return c.json({ success: false }, 500);
    }
  )
  .get("/profile", async (c) => {
    const { sub, name, picture } = c.get("providerUser");
    const user = c.get("user");
    if (!user) {
      return c.json<ProfileEndpoint>({
        providerUser: {
          name,
          picture,
          sub,
        },
      });
    }
    const { lineUid, ...data } = user;
    return c.json<ProfileEndpoint>({
      providerUser: {
        name,
        picture,
        sub,
      },
      data,
    });
  })
  .put("/linkProvider/:id", async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const { sub } = c.get("providerUser");
    const db = c.get("db");
    if (user) {
      if (user.uid === id) {
        // already linked, return success json but 4xx status code to indicate partial success
        return c.json({ success: true }, 409);
      }
      return c.json({ success: false }, 401);
    }
    try {
      await db
        .update(schema.users)
        .set({ lineUid: sub })
        .where(eq(schema.users.uid, id))
        .run();
      return c.json({ success: true });
    } catch (err) {
      console.error(err);
      return c.json({ success: true }, 500);
    }
  })
  .get("/ticket", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    if (!user) return c.json({ success: false }, 404);
    const data = await db.query.transactions.findMany({
      where: (tr) => eq(tr.uid, user.uid),
      with: {
        seats: true,
      },
    });
    return c.json({ success: true, data });
  });

export { apiApp };
