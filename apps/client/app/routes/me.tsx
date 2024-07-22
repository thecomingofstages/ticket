import { json } from "@remix-run/cloudflare";
import {
  MetaFunction,
  Outlet,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { Spinner } from "~/components/layout/Spinner";
import { initLiff } from "~/lib/liff";
import { client } from "~/rpc";
import logo from "~/images/logo-white.png";

export const meta: MetaFunction = () => [{ title: "TCOS Ticket Booking" }];

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

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex flex-col space-y-3 p-6">
      <img src={logo} alt="Logo" width={100} height={100} />
      <h1 className="font-bold text-2xl">ไม่สามารถดำเนินการตามคำขอ</h1>

      <p className="text-zinc-300 text-sm">
        {isRouteErrorResponse(error) ? (
          <>
            เซิร์ฟเวอร์แจ้งข้อผิดพลาด {error.status} {error.data.message}
          </>
        ) : (
          <>ระบบเกิดข้อผิดพลาด {error instanceof Error ? error.message : ""}</>
        )}
      </p>
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
