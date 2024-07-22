import { Link, MetaFunction, useRevalidator } from "@remix-run/react";
import TicketList, { TicketListItem } from "~/components/TicketList";
import { Button } from "~/components/ui/button";
import { useMyTicket } from "~/hooks/useMyTicket";
import { cn } from "~/lib/utils";
import { client } from "~/rpc";
import { Suspense, lazy, useState } from "react";
import { seatsArrayToString } from "~/lib/seat-sort";
import { Spinner } from "~/components/layout/Spinner";

export const meta: MetaFunction = () => [
  { title: "รายการบัตรเข้าชม : TCOS Ticket Booking" },
];

const RevokeTransferDialog = lazy(
  () => import("./me.ticket.transfer/RevokeTransferDialog")
);

type WithChildren = {
  children: React.ReactNode;
  className?: string;
};

const Section = ({ children, className }: WithChildren) => (
  <div className={cn("space-y-5", className)}>{children}</div>
);

const MetadataColumn = ({ children, className }: WithChildren) => (
  <div className={cn("flex flex-col gap-2", className)}>{children}</div>
);

const LargeTitle = ({ children }: WithChildren) => (
  <h2 className="text-2xl font-bold flex-grow">{children}</h2>
);

const Description = ({ children }: WithChildren) => (
  <p className="text-sm leading-6 text-zinc-300">{children}</p>
);

export default function MyTicketListPage() {
  const [loading, setLoading] = useState(false);
  const { data, transfers } = useMyTicket();
  const { revalidate, state } = useRevalidator();
  const revoke = async (acceptId: string) => {
    try {
      setLoading(true);
      await client.api.seatTransfer[":acceptId"].revoke.$post({
        param: { acceptId },
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    } finally {
      revalidate();
    }
  };
  return (
    <div className="flex-1 flex-grow overflow-y-auto">
      {(loading || state === "loading") && <Spinner text="กำลังดำเนินการ..." />}
      <div className="flex flex-col gap-6 flex-1 flex-grow px-5 py-6 leading-7">
        {transfers.length > 0 && (
          <>
            <Section className="space-y-4">
              <MetadataColumn>
                <LargeTitle>บัตรที่อยู่ระหว่างการโอน</LargeTitle>
                <Description>
                  รายการบัตรเหล่านี้อยู่ระหว่างรอผู้รับยืนยัน
                  เมื่อผู้รับกดยืนยันแล้ว บัตรจะถูกโอนไปยังผู้รับทันที
                </Description>
              </MetadataColumn>
              {transfers.map((tr) => (
                <Section key={tr.id} className="p-5 bg-white/15 rounded-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={"secondary"}
                      className="bg-[#06c755] hover:bg-[#06c755]"
                    >
                      แชร์รายการโอน
                    </Button>
                    <Suspense
                      fallback={
                        <Button variant={"destructive"} disabled>
                          ยกเลิกรายการโอน
                        </Button>
                      }
                    >
                      <RevokeTransferDialog
                        onConfirm={() => revoke(tr.id)}
                        seatString={seatsArrayToString(tr.seats)}
                      >
                        <Button variant={"destructive"}>ยกเลิกรายการโอน</Button>
                      </RevokeTransferDialog>
                    </Suspense>
                  </div>
                  {tr.seats.map((seat) => (
                    <TicketListItem seat={seat} tr={tr} key={seat.id} />
                  ))}
                </Section>
              ))}
            </Section>
          </>
        )}
        <Section>
          <MetadataColumn className="space-y-2.5">
            <div className="flex flex-row justify-stretch items-center gap-6">
              <LargeTitle>รายการบัตร</LargeTitle>
              <Link
                to="/me/ticket/transfer"
                className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-medium flex-shrink-0"
              >
                โอนบัตร
              </Link>
            </div>
            <Description>
              หากมีที่นั่งใดไม่ถูกต้อง โปรดแจ้งทาง LINE Official Account
            </Description>
          </MetadataColumn>
          <TicketList
            data={data}
            Content={() => (
              <Button variant={"secondary"} disabled size={"sm"}>
                ยังไม่ถึงเวลางาน
              </Button>
            )}
          />
        </Section>
      </div>
    </div>
  );
}
