export interface WSEvent {
  type: string;
}

interface WSServerToggleSeatEvent extends WSEvent {
  type: "toggleSeat";
  seat: string;
}

interface WSServerPersistEvent extends WSEvent {
  type: "persist";
}

export type WSServerEvents = WSServerToggleSeatEvent | WSServerPersistEvent;

export type SeatStatus = "selected" | "reserved" | "available";

interface WSClientSeatChangedEvent extends WSEvent {
  type: "seatChanged";
  status: SeatStatus;
  seat: string;
}

interface WSClientSeatsChangedEvent extends WSEvent {
  type: "seatsChanged";
  status: SeatStatus;
  seats: string[];
}

interface WSClientExpirationEvent extends WSEvent {
  type: "expiration";
  expiration: number;
}

export type WSClientEvents =
  | WSClientSeatChangedEvent
  | WSClientSeatsChangedEvent
  | WSClientExpirationEvent;
