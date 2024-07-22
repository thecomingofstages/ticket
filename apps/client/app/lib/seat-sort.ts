import { Seat } from "~/hooks/useMyTicket";

// seat is now sort properly on db (which i should done earlier)

export type SeatGroupByRound = [number, Seat[]][];
export const groupSeatByRound = (seats: Seat[]) => {
  return seats.reduce<SeatGroupByRound>((acc, seat) => {
    const prevRound = acc.at(-1)?.at(0);
    if (prevRound !== seat.round) {
      acc.push([seat.round, [seat]]);
    } else {
      acc[acc.length - 1][1].push(seat);
    }
    return acc;
  }, []);
};

export const seatsArrayToString = (seats: Array<Seat>) => {
  return groupSeatByRound(seats)
    .map(
      ([round, seats]) =>
        `รอบ ${round}:00 ที่นั่ง ${seats.map(({ seat }) => seat).join(", ")}`
    )
    .join(" ");
};
