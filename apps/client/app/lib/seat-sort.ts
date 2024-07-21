import { Seat } from "~/hooks/useMyTicket";

const splitSeatStr = (seat: string): [number, number] => {
  return [seat.charCodeAt(0), parseInt(seat.slice(1))];
};

export const seatSort = (a: string, b: string) => {
  // Seat is in format A19, B2, B21
  const [letterA, noA] = splitSeatStr(a);
  const [letterB, noB] = splitSeatStr(b);
  return letterA - letterB || noA - noB;
};

export const seatsArrayToString = (seats: Array<Pick<Seat, "seat">>) => {
  return seats
    .map(({ seat }) => seat!)
    .sort(seatSort)
    .join(", ");
};
