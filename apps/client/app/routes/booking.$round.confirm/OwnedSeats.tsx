import { useOutletContext } from "@remix-run/react";
import { UseReservedSeats } from "~/websocket/useReservedSeats";

export function OwnedSeats() {
  const ctx = useOutletContext<UseReservedSeats>();
  if (!ctx.loaded) return null;
  return (
    <div className="space-y-2 flex flex-col">
      <div className="flex gap-6">
        <h1 className="font-bold text-2xl flex-grow">ที่นั่งที่เลือกไว้</h1>
      </div>
      <div className="divide-y divide-zinc-600 flex-grow">
        <div className="flex justify-between py-3">
          <div className="flex flex-col space-y-0.5">
            <span className="font-bold text-lg">
              ที่นั่ง {ctx.ownedSeats.join(", ")}
            </span>
            <span className="text-zinc-300 text-sm">
              บัตรจำหน่ายล่วงหน้าสำหรับทีมงาน
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-medium text-lg">
              {(ctx.ownedSeats.length * 555).toLocaleString()}฿
            </span>
            <span className="text-zinc-400 text-sm">
              {ctx.ownedSeats.length} x 555฿
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
