import { useState } from "react";
import TicketList from "~/components/TicketList";
import BottomFooter from "~/components/layout/BottomFooter";
import { Button } from "~/components/ui/button";
import { Seat, useMyTicket } from "~/hooks/useMyTicket";
import { groupSeatByRound, seatsArrayToString } from "~/lib/seat-sort";
import ConfirmTransferDialog from "./ConfirmTransferDialog";
import { MetaFunction, useNavigate, useRevalidator } from "@remix-run/react";
import { client } from "~/rpc";
import { Spinner } from "~/components/layout/Spinner";
import { transferTicketMessage } from "~/lib/msg-template";

export const meta: MetaFunction = () => [
  { title: "โอนสิทธิ์เจ้าของบัตร : TCOS Ticket Booking" },
];

export default function MyTicketTransferPage() {
  const { data } = useMyTicket();
  const [selected, setSelected] = useState<Set<Seat>>(new Set());
  const seatsArray = Array.from(selected);
  const seatString = seatsArrayToString(seatsArray);

  const { revalidate } = useRevalidator();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const sendConfirmForm = async () => {
    const seatIds = seatsArray.map((s) => s.id);
    setLoading(true);
    try {
      const res = await client.api.seatTransfer.create.$post(
        {
          json: { seatIds },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setLoading(false);
      if (res.status === 200) {
        const {
          data: { acceptId, createdAt },
        } = await res.json();
        await transferTicketMessage({
          acceptId,
          createdAt,
          seats: seatsArray,
        });
        return navigate("/me/ticket", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    } finally {
      revalidate();
    }
  };

  return (
    <>
      {loading && <Spinner text="กำลังดำเนินการ..." />}
      <div className="flex-1 flex-grow overflow-y-auto">
        <div className="flex flex-col gap-6 flex-1 flex-grow px-5 py-6 leading-7">
          <div className="space-y-5">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex-grow">โอนบัตรเข้าชม</h2>
              <p className="text-sm leading-6 text-zinc-300">
                เลือกที่นั่งที่ต้องการโอน โดยสามารถส่งคำขอโอนผ่านแชทเพื่อนใน
                LINE และผู้รับจะต้อง<b>ลงทะเบียน</b>เพื่อรับบัตร
                เมื่อผู้รับกดยอมรับแล้ว
                บัตรจะถูกโอนไปยังผู้รับเพื่อใช้สำหรับเข้างานต่อไป
              </p>
              <p className="text-sm leading-6">
                คำขอโอนสามารถกดรับได้ 1 ครั้งเท่านั้น หากต้องการโอนให้ผู้รับหลายคน กรุณาแยกที่นั่งที่ต้องการโอนเป็นรายการแต่ละรายการ
              </p>
            </div>
            <TicketList
              data={data}
              Content={({ seat }) => (
                <Button
                  size={"sm"}
                  className={
                    selected.has(seat)
                      ? "bg-green-600 hover:bg-green-600 text-white"
                      : undefined
                  }
                  onClick={() => {
                    setSelected((s) => {
                      const next = new Set(s);
                      if (next.has(seat)) {
                        next.delete(seat);
                      } else {
                        next.add(seat);
                      }
                      return next;
                    });
                  }}
                >
                  เลือกที่นั่งนี้
                </Button>
              )}
            />
          </div>
        </div>
      </div>
      <BottomFooter className="gap-4">
        <div className="flex flex-col flex-grow justify-center gap-1">
          <span>
            <b>เลือกแล้ว</b> {selected.size} ที่นั่ง
          </span>
          <span className="text-xs text-zinc-400">{seatString}</span>
        </div>
        <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
          <ConfirmTransferDialog
            onConfirm={sendConfirmForm}
            seatString={seatString}
          >
            <Button
              disabled={selected.size === 0}
              className={`px-4 py-2 bg-white text-black rounded-lg`}
            >
              ส่งคำขอโอน
            </Button>
          </ConfirmTransferDialog>
        </div>
      </BottomFooter>
    </>
  );
}
