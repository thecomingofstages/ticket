import { Outlet, useParams } from "@remix-run/react";
import { Spinner } from "~/components/layout/Spinner";
import { useReservedSeats } from "~/websocket/useReservedSeats";

export default function RoundBookingLayout() {
  const { round } = useParams() as { round: string };
  const ctx = useReservedSeats({ round });
  return (
    <div className="flex flex-col h-screen justify-center">
      {!ctx.loaded && <Spinner />}
      <Outlet context={ctx} />
    </div>
  );
}
