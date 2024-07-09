import { Link, useOutletContext } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { SeatPicker } from "~/components/SeatPicker";
import BottomFooter from "~/components/layout/BottomFooter";
import { StepHeader } from "~/components/layout/StepHeader";
import { UseReservedSeats } from "~/websocket/useReservedSeats";

const createSeats = (row: string, length: number, gapsAfter: number[]) => ({
  row,
  seats: new Array(length).fill(row).map((x, i) => `${x}${i + 1}`),
  gapsAfter: Object.fromEntries(gapsAfter.map((x) => [`${row}${x}`, true])),
});
const seatsRow = [createSeats("B", 27, [6, 21]), createSeats("A", 25, [5, 20])];

export default function SeatingBooking() {
  const ctx = useOutletContext<UseReservedSeats>();
  return (
    <>
      <StepHeader
        no={2}
        title={"เลือกที่นั่ง"}
        description="เลื่อนผังและกดเลือกที่นั่งที่ต้องการ"
        backUrl="/booking"
      />
      <SeatPicker
        initialScrollToSeat={(ctx.loaded && ctx.ownedSeats?.[0]) || undefined}
      >
        <SeatPicker.PriceLabel price={555} />
        {seatsRow.map(({ row, seats, gapsAfter }) => (
          <SeatPicker.Row key={row}>
            {seats.map((seat) => (
              <Fragment key={seat}>
                <SeatPicker.Seat
                  seat={seat}
                  status={
                    ctx.loaded ? ctx.seats[seat] ?? "available" : undefined
                  }
                  onClick={
                    ctx.loaded ? () => ctx.updateSeat({ seat }) : undefined
                  }
                />
                {gapsAfter[seat] && <SeatPicker.Gap>{row}</SeatPicker.Gap>}
              </Fragment>
            ))}
          </SeatPicker.Row>
        ))}
        <SeatPicker.Stage />
      </SeatPicker>
      {/* <div className="flex gap-2 flex-wrap">
        {new Array(10).fill(null).map((_, i) => (
          <button
            className={`${
              seats[i.toString()] === "reserved"
                ? "bg-red-500"
                : seats[i.toString()] === "selected"
                ? "bg-yellow-700"
                : "bg-black"
            } text-white px-4 py-2 rounded-lg`}
            key={i}
            onClick={)}
          >
            Seat {i + 1}
          </button>
        ))}
      </div> */}
      <BottomFooter className="gap-4">
        <div className="flex flex-col flex-grow gap-1">
          <span>
            <b>เลือกแล้ว</b> {ctx.loaded ? ctx.ownedSeats.length : 0} ที่นั่ง
            {ctx.loaded && ctx.ownedSeats.length >= 4 && (
              <span className="text-red-700 font-medium"> (สูงสุด)</span>
            )}
          </span>
          <span className="text-xs text-zinc-400">
            ที่นั่ง {ctx.loaded && ctx.ownedSeats.join(", ")}
          </span>
        </div>
        <div className="flex items-center">
          {ctx.loaded && (
            <Link
              to={`/booking/${ctx.round}/confirm`}
              className={`px-4 py-2 bg-white text-black rounded-lg ${
                ctx.ownedSeats.length > 0 ? "opacity-100" : "opacity-0"
              } duration-150`}
            >
              ดำเนินการต่อ
            </Link>
          )}
        </div>
      </BottomFooter>
    </>
  );
}
