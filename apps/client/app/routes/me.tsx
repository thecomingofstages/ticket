import { json } from "@remix-run/cloudflare";
import { Outlet } from "@remix-run/react";
import { Spinner } from "~/components/layout/Spinner";
import { initLiff } from "~/lib/liff";
import { client } from "~/rpc";

export const clientLoader = async () => {
  await initLiff();
  const profile = await client.api.profile.$get().then((c) => c.json());
  return json(profile);
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
