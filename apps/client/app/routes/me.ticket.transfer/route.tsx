import { useState } from "react";
import TicketList from "~/components/TicketList";
import BottomFooter from "~/components/layout/BottomFooter";
import { Button } from "~/components/ui/button";
import { Seat } from "~/hooks/useMyTicket";
import { seatSort } from "~/lib/seat-sort";

export default function MyTicketTransferPage() {
  const [selected, setSelected] = useState<Set<Seat>>(new Set());
  const ticketString = Array.from(selected)
    .map(({ seat }) => seat!)
    .sort(seatSort)
    .join(", ");

  return (
    <>
      <div className="flex-1 flex-grow overflow-y-auto">
        <div className="flex flex-col gap-6 flex-1 flex-grow p-5 leading-7">
          <div className="space-y-5">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex-grow">
                โอนสิทธิ์เจ้าของที่นั่ง
              </h2>
              <p className="text-sm leading-6 text-zinc-300">
                เลือกที่นั่งที่ต้องการโอนสิทธิ์ให้ผู้อื่นในบัญชี LINE
                โดยผู้รับจะต้อง<b>ลงทะเบียนสมาชิกทีมงาน</b>เพื่อรับบัตร
                เมื่อผู้รับกดยอมรับแล้ว
                บัตรจะถูกโอนสิทธิ์เจ้าของไปยังผู้รับเพื่อใช้สำหรับเข้างานต่อไป
              </p>
            </div>
            <TicketList
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
          <span className="text-xs text-zinc-400">ที่นั่ง {ticketString}</span>
        </div>
        <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
          <Button className={`px-4 py-2 bg-white text-black rounded-lg`}>
            ส่งคำขอโอน
          </Button>
        </div>
      </BottomFooter>
    </>
  );
}
