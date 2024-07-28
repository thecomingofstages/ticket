import { Hono } from "hono";

import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./db-schema";
import { cors } from "hono/cors";
import { decode, verify } from "hono/jwt";
import { and, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { getJwk } from "./line/get-jwk";
import { TokenHeader } from "hono/utils/jwt/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { BatchItem } from "drizzle-orm/batch";
import { ulid } from "./lib/ulidx";
import { nanoid } from "nanoid";
import { createCheckInToken } from "./app-checkin";
import { isValid } from "date-fns";

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
  data?: Omit<schema.User, "lineUid" | "verified" | "uid">;
};

const apiApp = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use(
    (c, next) =>
      cors({
        origin: c.env.CORS_ALLOW_ORIGIN,
        allowHeaders: ["Authorization", "Content-Type"],
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
    // don't return the internal uid to the user
    // might be vulnerable at the linkProvider endpoint
    const { lineUid, uid, ...data } = user;
    return c.json<ProfileEndpoint>({
      providerUser: {
        name,
        picture,
        sub,
      },
      data,
    });
  })
  .post(
    "/profile",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        surname: z.string(),
        email: z.string().email(),
        phone: z.string(),
        department: z.string(),
      })
    ),
    async (c) => {
      const existingUser = c.get("user");
      if (existingUser) {
        // we don't allow profile updating at this time.
        return c.json({ success: false }, 403);
      }
      const { name, surname, ...profile } = c.req.valid("json");
      const db = c.get("db");

      const { sub } = c.get("providerUser");
      try {
        await db
          .insert(schema.users)
          .values({
            ...profile,
            name: `${name} ${surname}`,
            lineUid: sub,
            uid: nanoid(10),
          })
          .run();
        return c.json({ success: true });
      } catch (err) {
        console.error(err);
        return c.json({ success: true }, 500);
      }
    }
  )
  .put("/linkProvider/:id", async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const { sub } = c.get("providerUser");
    const db = c.get("db");
    if (user) {
      if (user.uid === id) {
        // already linked, return success json but 4xx status code to indicate partial success
        return c.json({ success: true } as const, 409);
      }
      return c.json(
        {
          success: false,
          message: "ลิงก์ URL เข้าใช้งานไม่ถูกต้อง โปรดติดต่อ LINE Official",
        } as const,
        401
      );
    }
    try {
      await db
        .update(schema.users)
        .set({ lineUid: sub })
        .where(eq(schema.users.uid, id))
        .run();
      return c.json({ success: true } as const, 200);
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "" } as const, 500);
    }
  })
  .get("/ticket", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    if (!user)
      return c.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้" } as const,
        404
      );
    // only a single uid filter should work. we don't need to worry about seatTransfers here
    // - completed transfer will automatically be assigned to the new owner, so it won't be shown
    // - pending transfer still fine to be shown, as it's still assigned to the current owner,
    //   but we'll post populate the results
    const results = await db.query.transactions.findMany({
      where: (tr) => eq(tr.uid, user.uid),
      with: {
        seats: {
          columns: {
            transactionId: false,
          },
        },
        transfers: {
          columns: {
            createdAt: true,
            transferAcceptId: true,
            seatId: true,
          },
          where: (tr) => isNull(tr.toTransactionId),
        },
      },
    });
    type Result = (typeof results)[number];
    type Tr = Omit<Result, "transfers">;
    type TransferTr = Omit<Tr, "isTransfered"> & {
      isTransfered: false;
    };
    type Seat = Result["seats"][number];
    // separate the transfered seats from the original transaction
    const { data, transfers } = results.reduce<{
      // deduplicate transfers globally by transferId
      // because the same transfer might be assigned to multiple seats and transactions
      transfers: Record<string, TransferTr>;
      data: Tr[];
    }>(
      (acc, tr) => {
        const { transfers, ...rest } = tr;
        if (transfers.length > 0) {
          const { uid, round } = tr;
          // use map to quickly find the seat by id, and remove it from the map after it's found
          const seatMap = tr.seats.reduce<Map<string, Seat>>((acc, seat) => {
            acc.set(seat.id, seat);
            return acc;
          }, new Map());
          transfers.forEach((transfer) => {
            const { createdAt, transferAcceptId, seatId } = transfer;
            if (!acc.transfers[transferAcceptId]) {
              acc.transfers[transferAcceptId] = {
                id: transferAcceptId,
                round,
                uid,
                createdAt,
                isTransfered: false,
                seats: [],
                submittedAt: null,
              };
            }
            const seat = seatMap.get(seatId);
            if (seat) {
              acc.transfers[transferAcceptId].seats.push(seat);
              seatMap.delete(seatId);
            }
          });
          if (seatMap.size > 0) {
            acc.data.push({
              ...rest,
              seats: Array.from(seatMap.values()),
            });
          }
        } else {
          acc.data.push(rest);
        }
        return acc;
      },
      {
        transfers: {},
        data: [],
      }
    );
    return c.json(
      {
        success: true,
        data,
        transfers: Object.values(transfers),
      } as const,
      200
    );
  })
  .get("/seat/:seatId", async (c) => {
    const db = c.get("db");
    const seatId = c.req.param("seatId");
    const user = c.get("user");
    const result = await db.query.seats.findFirst({
      where: (s) => eq(s.id, seatId),
    });
    if (!result || !user) {
      return c.json({ success: false }, 404);
    }
    const { checkInAt, ...data } = result;
    const { uid } = user;
    const checkIn:
      | {
          success: true;
          at: Date;
        }
      | {
          success: false;
          token: string;
          exp: number;
        } =
      checkInAt && isValid(checkInAt)
        ? { success: true, at: checkInAt }
        : {
            success: false,
            ...(await createCheckInToken(
              {
                aud: seatId,
                sub: uid,
              },
              c.env.HMAC_SECRET
            )),
          };
    return c.json({ success: true, data: { ...data, checkIn } }, 200);
  })
  .post(
    "/seatTransfer/create",
    zValidator(
      "json",
      z.object({
        seatIds: z.array(z.string()),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      if (!user) return c.json({ success: false }, 404);
      const { seatIds } = c.req.valid("json");
      /**
       * to create a pending transfer, we need to
       * create a new seat transfer record for each seat
       *
       * but don't assigned the seat to the new transaction yet
       * to allow easy rollback if needed
       */
      // get all trs that is owned by the current user...
      const allTrs = await db.query.transactions.findMany({
        columns: {
          id: true,
        },
        where: (tr) => and(eq(tr.uid, user.uid)),
        orderBy: (tr, { asc }) => asc(tr.round),
        with: {
          // and their seats ownership...
          seats: {
            columns: {
              id: true,
            },
            where: (seats) => inArray(seats.id, seatIds),
            with: {
              // and also query any pending transfers, so that we can filter it out.
              transfer: {
                columns: {
                  transferAcceptId: true,
                },
                where: (tr) => isNull(tr.toTransactionId),
              },
            },
          },
        },
      });
      // perform validation
      // - allow seats that doesn't have any pending transfer
      // - skip transactions that has no remaining seats
      const trs = allTrs.reduce<typeof allTrs>((acc, tr) => {
        const seats = tr.seats.filter((seat) => seat.transfer.length === 0);
        if (seats.length > 0) {
          acc.push({ ...tr, seats });
        }
        return acc;
      }, []);
      // no valid tr found! reject
      if (trs.length === 0) return c.json({ success: false }, 404);

      // define a shared `acceptId` for all seat transfers
      // use this id for transfer accept and revoke of all seats
      const acceptId = nanoid(6);
      const createdAt = new Date();

      // apply all db changes in a single transaction
      // will fail all if one of the commits failed
      const commits = trs
        .map<BatchItem<"sqlite">[]>((tr) =>
          tr.seats.map((seat) =>
            db.insert(schema.seatTransfers).values({
              id: ulid(Date.now()),
              fromTransactionId: tr.id,
              seatId: seat.id,
              transferAcceptId: acceptId,
              createdAt,
            })
          )
        )
        .flat();
      try {
        await db.batch(
          commits as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]
        );
        return c.json({ success: true, data: { createdAt, acceptId } });
      } catch (err) {
        console.error(err);
        return c.json({ success: false }, 500);
      }
    }
  )
  .post("/seatTransfer/:acceptId/revoke", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    if (!user) return c.json({ success: false }, 404);
    const acceptId = c.req.param("acceptId");
    // as the seat transfer records are separate from the source one
    // we sure can delete them right away!
    // but are you sure they haven't accept it yet?
    const acceptedTransfer = await db.query.seatTransfers.findFirst({
      where: (tr) =>
        and(eq(tr.transferAcceptId, acceptId), isNotNull(tr.toTransactionId)),
    });
    if (acceptedTransfer) {
      // some have already accepted! failure!
      return c.json({ success: false }, 409);
    }
    // delete those record
    try {
      await db.delete(schema.seatTransfers).where(
        and(
          eq(schema.seatTransfers.transferAcceptId, acceptId),
          // we might not need this check again, but for safety..
          isNull(schema.seatTransfers.toTransactionId)
        )
      );
      return c.json({ success: true }, 200);
    } catch (err) {
      console.error(err);
      return c.json({ success: false }, 500);
    }
  })
  .post("/seatTransfer/:acceptId/accept", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    // fallback to profile register on client
    if (!user) return c.json({ success: false }, 403);
    const acceptId = c.req.param("acceptId");
    /**
     * to accept a transfer, we need to
     * - create a new transfer transaction
     * - update the seat transactionId to the new transfer transaction
     *
     * this operation is non-destructvie.
     * once the transfer is accepted, the seat will be assigned to the new owner.
     * the best way to revert this action is to create a new transfer back to the original owner
     */
    const transfers = await db.query.seatTransfers.findMany({
      columns: {
        id: true,
        fromTransactionId: true,
        createdAt: true,
      },
      where: (tr) =>
        and(eq(tr.transferAcceptId, acceptId), isNull(tr.toTransactionId)),
      with: {
        seat: {
          columns: {
            id: true,
            round: true,
          },
        },
      },
    });
    if (transfers.length === 0) return c.json({ success: false }, 404);
    // todo: prevent some weird case like transfer to yourself?
    // group all transfers by the original transaction
    const transfersByRound = transfers.reduce((acc, tr) => {
      const roundStr = tr.seat.round.toString();
      if (!(roundStr in acc)) {
        acc[roundStr] = [];
      }
      acc[roundStr].push(tr);
      return acc;
    }, {} as Record<string, (typeof transfers)[number][]>);

    // apply all db changes in a single transaction
    // will fail all if one of the commits failed
    let commits: BatchItem<"sqlite">[] = [];
    const submittedAt = new Date();

    for (const roundStr in transfersByRound) {
      const round = parseInt(roundStr);
      const trs = transfersByRound[roundStr];
      const newTrId = ulid(Date.now());
      // create a new transaction, marked for transfer.
      const createNewTr = db.insert(schema.transactions).values({
        id: newTrId,
        uid: user.uid,
        round,
        isTransfered: true,
        createdAt: trs[0].createdAt,
        submittedAt,
      });

      const batchRecords = trs
        .map((tr) => [
          // update the seat transfer record to the new transaction
          db
            .update(schema.seatTransfers)
            .set({
              toTransactionId: newTrId,
            })
            .where(eq(schema.seatTransfers.id, tr.id)),
          // update the seat transactionId to the new transaction
          db
            .update(schema.seats)
            .set({
              transactionId: newTrId,
            })
            .where(eq(schema.seats.id, tr.seat.id)),
        ])
        .flat();

      commits = commits.concat(createNewTr, batchRecords);
    }
    try {
      await db.batch(
        commits as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]
      );
      return c.json({ success: true });
    } catch (err) {
      console.error(err);
      return c.json({ success: false }, 500);
    }
  })
  .get("/seatTransfer/:acceptId", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    if (!user)
      return c.json(
        { success: false, message: "กรุณาลงทะเบียนผู้ใช้งาน" } as const,
        403
      );
    const acceptId = c.req.param("acceptId");
    // retrieve all seats from the given transfer acceptId
    const results = await db.query.seatTransfers.findMany({
      columns: {
        createdAt: true,
      },
      where: (tr) =>
        eq(tr.transferAcceptId, acceptId),
      with: {
        seat: {
          columns: {
            transactionId: false,
          },
        },
        transferedTo:{
          columns: {
            uid: true
          }
        },
        transferedFrom: {
          columns: {},
          with: {
            owner: {
              columns: {
                name: true,
                department: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    // if there's any transferedTo, then the transfer is already accepted.
    if (results.length === 0 || results.some((tr) => tr.transferedTo)) {
      if(results.some((tr) => tr.transferedTo?.uid === user.uid)) {
        // should redirect to ticket pags on client
        return c.json({
          success: false,
          message: "คำขอโอนนี้ถูกยอมรับแล้ว",
        } as const, 409)
      }
      return c.json(
        {
          success: false,
          message: "ไม่พบคำขอโอนที่ต้องการ คำขอนี้อาจใช้หรือถูกยกเลิกไปแล้ว",
        } as const,
        404
      );
    }
    // results from drizzle query are duplicated
    // in reality, the createdAt field (the date this seatTransfer was initiated)
    // and the owner field (the original owner of the seat) should be the same single value
    // so for performance we can simply grab from the first index
    const createdAt = results[0].createdAt;
    const owner = results[0].transferedFrom.owner;
    owner.phone =
      owner.phone.slice(0, 2) +
      new Array(owner.phone.length - 4).fill("X").join("") +
      owner.phone.slice(-2);
    // for the seats, we need to return an array of results as usual.
    const seats = results.map((tr) => tr.seat);
    // let's also return the user data to eliminate multiple requests
    const { name, department, phone } = user;
    const { picture } = c.get("providerUser");
    return c.json(
      {
        success: true,
        data: {
          createdAt,
          owner,
          seats,
          user: { name, department, phone, picture },
        } as const,
      },
      200
    );
  });

export { apiApp };
