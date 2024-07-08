import { Link } from "@remix-run/react";
import { useMemo } from "react";
import { useReservedSeats } from "~/websocket/useReservedSeats";

export default function SeatingBooking() {
  const room = useMemo(() => "default", []);
  const { seats, ownedSeats, updateSeat } = useReservedSeats({ room });
  return (
    <div>
      <h1>Seat Booking</h1>
      <div className="flex gap-2 flex-wrap">
        {new Array(10).fill(null).map((_, i) => (
          <button
            className={`${
              seats?.[i.toString()] === "reserved"
                ? "bg-red-500"
                : seats?.[i.toString()] === "selected"
                ? "bg-yellow-700"
                : "bg-black"
            } text-white px-4 py-2 rounded-lg`}
            key={i}
            onClick={() => updateSeat({ seat: i.toString() })}
          >
            Seat {i + 1}
          </button>
        ))}
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-col flex-grow">
          <span>Selected: {ownedSeats?.length ?? 0}</span>
        </div>
        <div>
          {ownedSeats && ownedSeats.length > 0 && (
            <Link to="/booking/seat/confirm">Continue</Link>
          )}
        </div>
      </div>
    </div>
  );
}
