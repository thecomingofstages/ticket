import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import {
  Link,
  MetaFunction,
  useLoaderData,
  useOutletContext,
} from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { SeatPicker } from "~/components/SeatPicker";
import { TimeRemaining } from "~/components/TimeRemaining";
import BottomFooter from "~/components/layout/BottomFooter";
import { StepHeader } from "~/components/layout/StepHeader";
import { reserved1300, reserved1800 } from "~/pre-reserved";
import { UseReservedSeats } from "~/websocket/useReservedSeats";

const createSeats = (row: string, length: number, gapsAfter: number[]) => ({
  row,
  seats: new Array(length).fill(row).map((x, i) => `${x}${i + 1}`),
  gapsAfter: Object.fromEntries(gapsAfter.map((x) => [`${row}${x}`, true])),
});
const seatsRow = [createSeats("B", 27, [6, 21]), createSeats("A", 25, [5, 20])];

export const meta: MetaFunction = () => [
  {
    title: "เลือกที่นั่ง : TCOS Ticket System",
  },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { round } = params as { round: string };
  if (round == "1300") {
    return json({
      reserved: reserved1300,
    });
  } else if (round == "1800") {
    return json({ reserved: reserved1800 });
  } else {
    return json({ reserved: [] });
  }
};

export default function SeatingBooking() {
  const { reserved } = useLoaderData<typeof loader>();
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
                    reserved.includes(seat)
                      ? "reserved"
                      : ctx.loaded
                      ? ctx.ownedSeats.includes(seat)
                        ? "selected"
                        : ctx.seats[seat] ?? "available"
                      : undefined
                  }
                  onClick={
                    !reserved.includes(seat) && ctx.loaded
                      ? () => ctx.updateSeat({ seat })
                      : undefined
                  }
                />
                {gapsAfter[seat] && <SeatPicker.Gap>{row}</SeatPicker.Gap>}
              </Fragment>
            ))}
          </SeatPicker.Row>
        ))}
        <SeatPicker.Stage />
      </SeatPicker>
      <BottomFooter className="gap-4">
        <div className="flex flex-col flex-grow justify-center gap-1">
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
        <div className="flex flex-col items-end justify-center gap-2">
          {ctx.loaded && (
            <Link
              to={`/booking/${ctx.round}/confirm`}
              className={`px-4 py-2  rounded-lg ${
                ctx.ownedSeats.length > 0
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-600"
              } transition-colors duration-150`}
            >
              ดำเนินการต่อ
            </Link>
          )}
          <TimeRemaining expiration={ctx.loaded ? ctx.expiration : undefined} />
        </div>
      </BottomFooter>
    </>
  );
}
