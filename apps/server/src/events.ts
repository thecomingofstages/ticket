export interface WSEvent {
  type: string;
}

interface WSServerToggleSeatEvent extends WSEvent {
  type: "toggleSeat";
  seat: string;
}

export type WSServerEvents = WSServerToggleSeatEvent;

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

export type WSClientEvents =
  | WSClientSeatChangedEvent
  | WSClientSeatsChangedEvent;
