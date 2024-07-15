import { useMemo } from "react";
import { Transaction, Seat, useMyTicket } from "~/hooks/useMyTicket";

type RenderFnArgs = {
  tr: Transaction;
  seat: Seat;
};

export type ItemProps = RenderFnArgs & {
  className: string;
  children: React.ReactNode;
};

type TicketListProps = {
  Item: (props: ItemProps) => React.ReactNode;
  Content?: (args: RenderFnArgs) => React.ReactNode;
};

function TicketListItem({
  tr,
  seat,
  Item,
  Content,
}: RenderFnArgs & TicketListProps) {
  return (
    <Item tr={tr} seat={seat} className="flex flex-row w-full">
      <div className="bg-white text-black flex flex-col items-center justify-center p-4 rounded-l-lg">
        <span className="text-sm text-zinc-700">รอบ</span>
        <b className="text-xl">{tr.round}:00</b>
      </div>
      <div className="bg-white/10 flex flex-col flex-grow p-4 rounded-r-lg space-y-0.5">
        <b>ที่นั่ง {seat.seat}</b>
        <span className="text-xs text-zinc-300 pb-3">
          ทำรายการเมื่อ {new Date(tr.submittedAt).toLocaleString("th-TH")}
        </span>
        {Content && Content({ tr, seat })}
      </div>
    </Item>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DefaultItem = ({ tr, seat, ...props }: ItemProps) => <div {...props} />;

export default function TicketList({
  Item,
  Content,
}: Partial<TicketListProps>) {
  const data = useMyTicket();

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
          Item={Item ?? DefaultItem}
          Content={Content}
        />
      ))}
    </div>
  );
}
