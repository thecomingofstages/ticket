import {
  ClientActionFunctionArgs,
  json,
  useLoaderData,
} from "@remix-run/react";
import { client } from "~/rpc";
import logo from "~/images/logo-white.png";
import { initLiff } from "~/lib/liff";
import QRCode from "react-qr-code";

export const clientLoader = async ({ params }: ClientActionFunctionArgs) => {
  await initLiff();
  const { seatId } = params as { seatId: string };
  const res = await client.api.seat[":seatId"].$get({ param: { seatId } });
  if (res.status === 200) {
    const data = await res.json();
    return json(data);
  }
  throw json({ success: false }, res.status);
};

export default function SeatPage() {
  const { data: seat } = useLoaderData<typeof clientLoader>();
  return (
    <div className="flex flex-col space-y-4 p-6">
      <header className="space-y-3">
        <img src={logo} alt="Logo" width={100} height={100} />
        <h1 className="font-bold text-2xl">แสดงบัตรเข้าชม</h1>
        <p className="text-zinc-300 text-sm">
          บัตรการแสดงละครเวทีเรื่อง &quot;Hansel and Gratel : Home Sweet Home
          The Musical&quot;
        </p>
      </header>
      <section className="bg-white/10 p-4 rounded-sm space-y-4">
        <b className="text-xl">ข้อมูลบัตรเข้าชม</b>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <b>รอบการแสดง</b>
            <span className="text-zinc-300">{seat.round}</span>
            <b>ที่นั่ง</b>
            <span className="text-zinc-300">{seat.seat}</span>
            <b>สถานะบัตรเข้าชม</b>
            <span className="text-green-300">ใช้งานได้</span>
          </div>
        </div>
      </section>
      <section className="bg-white/10 p-4 rounded-sm space-y-3">
        <b className="text-xl">ข้อมูล E-Ticket</b>
        <p className="text-zinc-300 pt-1">
          โปรดแสดง QR Code นี้ให้แก่เจ้าหน้าที่เพื่อสแกนก่อนเข้างาน
        </p>
        <div className="flex w-full items-center justify-center py-4">
          <div className="bg-white p-4">
            <QRCode size={250} value="Hey This is not actual ticket!" />
          </div>
        </div>
      </section>
    </div>
  );
}
