import { useMemo } from "react";
import { Transaction, Seat } from "~/hooks/useMyTicket";

type RenderFnArgs = {
  tr: Pick<Transaction, "createdAt" | "submittedAt" | "isTransfered">;
  seat: Seat;
};

export type ItemProps = RenderFnArgs & {
  className: string;
  children: React.ReactNode;
};

type TicketListProps = {
  Content?: (args: RenderFnArgs) => React.ReactNode;
};

export function TicketListItem({
  tr,
  seat,
  Content,
}: RenderFnArgs & TicketListProps) {
  return (
    <div className="flex flex-row w-full">
      <div className="bg-white text-black flex flex-col items-center justify-center p-4 rounded-l-lg">
        <span className="text-sm text-zinc-700">รอบ</span>
        <b className="text-xl">{seat.round}:00</b>
      </div>
      <div className="bg-[#1a1a1a] flex flex-col flex-grow p-4 rounded-r-lg space-y-3">
        <div className="flex flex-col space-y-1">
          <span className="font-bold flex items-center gap-2">
            ที่นั่ง {seat.seat}{" "}
            {tr.isTransfered && (
              <span className="bg-purple-500/70 px-3 py-1 rounded-lg text-xs font-medium">
                จากการโอนที่นั่ง
              </span>
            )}
          </span>
          <span className="text-xs text-zinc-300">
            ทำรายการเมื่อ{" "}
            {new Date(tr.submittedAt ?? tr.createdAt).toLocaleString("th-TH")}
          </span>
        </div>
        {Content && Content({ tr, seat })}
      </div>
    </div>
  );
}

export default function TicketList({
  Content,
  data,
}: Partial<TicketListProps> & {
  data: Transaction[];
}) {
  // flatten data into a single array makes render performance better
  const flattenData = useMemo(
    () => data.map((tr) => tr.seats.map((seat) => ({ tr, seat }))).flat(),
    [data]
  );

  return (
    <div className="space-y-5">
      {flattenData.map(({ tr, seat }) => (
        <TicketListItem
          key={`${tr.id}:${seat.id}`}
          tr={tr}
          seat={seat}
          Content={Content}
        />
      ))}
    </div>
  );
}
