import { DurableObject } from "cloudflare:workers";
import { WSClientEvents, WSServerEvents } from "../events";

type SessionData = {
  uid: string;
  seats: string[];
  quit?: boolean;
};

const asClientEvent = (event: WSClientEvents) => JSON.stringify(event);

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
    return new Response(null, {
      status: 101,
      webSocket: pair[0],
    });
  }

  async websocketInit(webSocket: WebSocket, uid: string) {
    this.state.acceptWebSocket(webSocket);
    const session: SessionData = {
      uid,
      seats: [],
    };
    this.setSessionData(webSocket, session);
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
      console.log("Broadcast message to", session.uid);
      if (exclude && exclude === webSocket) return;
      try {
        console.log("Message", message);
        webSocket.send(message);
      } catch (e) {
        session.quit = true;
        seatsBecameAvailable = seatsBecameAvailable.concat(session.seats);
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
    this.sessions.delete(webSocket);
    // todo: notify remaining clients for new available seats
  }

  webSocketClose(ws: WebSocket): void | Promise<void> {
    this.closeOrErrorHandler(ws);
  }

  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
    this.closeOrErrorHandler(ws);
  }
}
