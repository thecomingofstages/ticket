import { useEffect, useMemo } from "react";
import { useReservedSeats } from "~/websocket/useReservedSeats";

export default function SeatingBooking() {
  const room = useMemo(() => "default", []);
  const { data: seats, updateSeat } = useReservedSeats({ room });

  useEffect(() => {
    console.log(seats);
  }, [seats]);
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
    </div>
  );
}
