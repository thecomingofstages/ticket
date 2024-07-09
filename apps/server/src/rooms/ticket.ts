import { DurableObject } from "cloudflare:workers";
import { WSClientEvents, WSServerEvents } from "../events";
import { ulid } from "../lib/ulidx";
import { add } from "date-fns";

type SessionData = {
  createdAt: number;
  expiresAt: number | null;
  transactionId: string;
  uid: string;
  seats: string[];
  quit?: boolean;
  persist?: boolean;
};

const asClientEvent = (event: WSClientEvents) => JSON.stringify(event);

const STORAGE_KEY = "completed-dev";
export class TicketRoom extends DurableObject {
  sessions: Map<WebSocket, SessionData>;

  private state: DurableObjectState;
  private reservedSeats: Set<string>;
  //   private storage: DurableObjectStorage;
  constructor(state: DurableObjectState, env: {}) {
    super(state, env);
    this.state = state;
    this.sessions = new Map();
    this.reservedSeats = new Set();
    state.blockConcurrencyWhile(async () => {
      const reserved = await state.storage.get(STORAGE_KEY);
      console.log(JSON.stringify(reserved));
      if (reserved) {
        Object.values(reserved).forEach(({ seats }) => {
          seats.forEach((seat) => {
            this.reservedSeats.add(seat);
          });
        });
      }
    });
    state.getWebSockets().forEach((ws) => {
      const data = ws.deserializeAttachment() as SessionData;
      this.sessions.set(ws, data);
      data.seats?.forEach((seat) => {
        this.reservedSeats.add(seat);
      });
    });
  }

  async fetch(request: Request) {
    const pair = new WebSocketPair();
    const uid = request.headers.get("X-UID");
    if (!uid) {
      return new Response(null, {
        status: 401,
      });
    }
    await this.websocketInit(pair[1], uid);
    await this.setNextExpirationAlarm();
    return new Response(null, {
      status: 101,
      webSocket: pair[0],
    });
  }

  async alarm(): Promise<void> {
    // check for any expired sessions
    const now = Date.now();
    for (const [ws, session] of this.sessions.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        session.quit = true;
        ws.close(3008, "Session expired");
      }
    }
    await this.setNextExpirationAlarm();
  }

  initSession(webSocket: WebSocket, uid: string) {
    const now = Date.now();
    // draft payments will be expired in 5 minutes
    const expires = add(now, { minutes: 5 });
    const session: SessionData = {
      createdAt: now,
      expiresAt: expires.valueOf(),
      uid,
      transactionId: ulid(now),
      seats: [],
    };
    this.setSessionData(webSocket, session);
    return session;
  }

  async setNextExpirationAlarm() {
    let nextExpiration = Infinity;
    for (const session of this.sessions.values()) {
      if (session.quit) continue;
      if (session.expiresAt && session.expiresAt < nextExpiration) {
        nextExpiration = session.expiresAt;
      }
    }
    if (nextExpiration === Infinity) return;
    const currentAlarm = await this.state.storage.getAlarm();
    if (currentAlarm && currentAlarm < nextExpiration) return;
    console.log("nextExpiration", nextExpiration);
    return this.state.storage.setAlarm(nextExpiration);
  }

  async websocketInit(webSocket: WebSocket, uid: string) {
    this.state.acceptWebSocket(webSocket);
    const session = this.initSession(webSocket, uid);
    if (session.expiresAt) {
      webSocket.send(
        asClientEvent({
          type: "expiration",
          expiration: session.expiresAt,
        })
      );
    }
    if (this.reservedSeats.size > 0) {
      webSocket.send(
        asClientEvent({
          type: "seatsChanged",
          seats: Array.from(this.reservedSeats),
          status: "reserved",
        })
      );
    }
  }

  private async sendError(ws: WebSocket, message: string) {
    ws.send(
      JSON.stringify({
        type: "error",
        message,
      })
    );
  }

  private setSessionData(webSocket: WebSocket, session: SessionData) {
    webSocket.serializeAttachment({
      ...webSocket.deserializeAttachment(),
      ...session,
    });
    this.sessions.set(webSocket, session);
  }

  protected broadcast(
    message: string,
    {
      exclude,
    }: {
      exclude?: WebSocket;
    } = {}
  ) {
    let seatsBecameAvailable: string[] = [];
    this.sessions.forEach((session, webSocket) => {
      if (exclude && exclude === webSocket) return;
      try {
        webSocket.send(message);
      } catch (e) {
        session.quit = true;
        if (!session.persist) {
          seatsBecameAvailable = seatsBecameAvailable.concat(session.seats);
        }
        this.sessions.delete(webSocket);
      }
    });
    // todo: notify remaining clients for new available seats
    if (seatsBecameAvailable.length > 0) {
      this.broadcast(
        asClientEvent({
          type: "seatsChanged",
          seats: seatsBecameAvailable,
          status: "available",
        })
      );
    }
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message !== "string") return;
    const data = JSON.parse(message) as WSServerEvents;
    if (data.type === "persist") {
      const session = this.sessions.get(ws);
      if (!session) return this.sendError(ws, "No session found");
      session.persist = true;
      const previous = (await this.state.storage.get(STORAGE_KEY)) ?? {};
      session.seats.map((seet) => {
        this.reservedSeats.add(seet);
      });
      await this.state.storage.put(STORAGE_KEY, {
        ...previous,
        [session.transactionId]: {
          uid: session.uid,
          seats: session.seats,
        },
      });
      console.log(await this.state.storage.get(STORAGE_KEY));
    }

    if (data.type === "toggleSeat") {
      const currentSession = this.sessions.get(ws);
      if (!currentSession) return this.sendError(ws, "No session found");
      if (currentSession.seats.includes(data.seat)) {
        currentSession.seats = currentSession.seats.filter(
          (seat) => seat !== data.seat
        );
        this.reservedSeats.delete(data.seat);
        this.setSessionData(ws, currentSession);
        this.broadcast(
          asClientEvent({
            type: "seatChanged",
            seat: data.seat,
            status: "available",
          })
        );
      } else if (currentSession.seats.length >= 4) {
        return this.sendError(ws, "You can't select more than 4 seats");
      } else if (this.reservedSeats.has(data.seat)) {
        return this.sendError(ws, "This seat has already reserved.");
      } else {
        currentSession.seats.push(data.seat);
        this.setSessionData(ws, currentSession);
        this.reservedSeats.add(data.seat);
        ws.send(
          asClientEvent({
            type: "seatChanged",
            seat: data.seat,
            status: "selected",
          })
        );
        this.broadcast(
          asClientEvent({
            type: "seatChanged",
            seat: data.seat,
            status: "reserved",
          }),
          { exclude: ws }
        );
      }
    }
  }

  protected async closeOrErrorHandler(webSocket: WebSocket) {
    let session = this.sessions.get(webSocket);
    if (!session) return;
    session.quit = true;
    if (!session.persist) {
      session.seats.forEach((seat) => {
        this.reservedSeats.delete(seat);
      });
      this.broadcast(
        asClientEvent({
          type: "seatsChanged",
          seats: session.seats,
          status: "available",
        }),
        {
          exclude: webSocket,
        }
      );
    }
    this.sessions.delete(webSocket);
    await this.setNextExpirationAlarm();
  }

  webSocketClose(ws: WebSocket): void | Promise<void> {
    this.closeOrErrorHandler(ws);
  }

  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
    this.closeOrErrorHandler(ws);
  }
}
