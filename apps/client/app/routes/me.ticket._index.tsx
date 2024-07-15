import { Link } from "@remix-run/react";
import TicketList from "~/components/TicketList";
import { Button } from "~/components/ui/button";

export default function MyTicketListPage() {
  return (
    <div className="flex-1 flex-grow overflow-y-auto">
      <div className="flex flex-col gap-6 flex-1 flex-grow p-5 leading-7">
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="flex flex-row items-center gap-6">
              <h2 className="text-2xl font-bold flex-grow">รายการที่นั่ง</h2>
              <Link
                to="/me/ticket/transfer"
                className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-medium flex-shrink-0"
              >
                โอนสิทธิ์เจ้าของบัตร
              </Link>
            </div>
            <p className="text-sm leading-5 text-zinc-300">
              หากมีที่นั่งใดไม่ถูกต้อง โปรดแจ้งทาง LINE Official Account
            </p>
          </div>
          <TicketList
            Content={() => (
              <Button variant={"secondary"} disabled size={"sm"}>
                ยังไม่ถึงเวลางาน
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}
