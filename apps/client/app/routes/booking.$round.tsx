import { Outlet, useParams } from "@remix-run/react";
import { useReservedSeats } from "~/websocket/useReservedSeats";

export default function RoundBookingLayout() {
  const { round } = useParams() as { round: string };
  const ctx = useReservedSeats({ round });
  return <Outlet context={ctx} />;
}
