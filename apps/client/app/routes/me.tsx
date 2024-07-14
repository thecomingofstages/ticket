import { json } from "@remix-run/cloudflare";
import { ClientLoaderFunction, Outlet } from "@remix-run/react";
import { Spinner } from "~/components/layout/Spinner";
import { initLiff } from "~/lib/liff";

export const clientLoader: ClientLoaderFunction = async () => {
  await initLiff();
  return json({});
};

export function HydrateFallback() {
  return (
    <div className="flex flex-col h-screen justify-center">
      <Spinner text="กำลังโหลดข้อมูลและเข้าสู่ระบบ..." />
    </div>
  );
}

export default function TicketLayout() {
  return (
    <div className="flex flex-col h-screen justify-center">
      <Outlet />
    </div>
  );
}
