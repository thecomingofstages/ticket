import { useOutletContext } from "@remix-run/react";
import { UseReservedSeats } from "~/websocket/useReservedSeats";

export default function SeatingConfirm() {
  const ctx = useOutletContext<UseReservedSeats>();
  if (!ctx.loaded) return null;
  const { ownedSeats } = ctx;
  return (
    <div>
      <h1>Seat Booking 22222</h1>
      <div className="flex gap-2 flex-wrap">{ownedSeats?.join("/")}</div>
    </div>
  );
}
