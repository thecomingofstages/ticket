import { useSearchParams } from "@remix-run/react";

export default function CheckInSuccess() {
  const [params] = useSearchParams();
  return (
    <section className="bg-white/10 p-4 rounded-sm space-y-4">
      <b className="text-xl">Operation successful</b>
      <p className="text-zinc-300 py-1">
        Successfully check-in seat {params.get("seatId")}. You may now close
        this window.
      </p>
    </section>
  );
}
