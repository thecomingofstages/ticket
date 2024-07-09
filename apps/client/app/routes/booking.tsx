import { json } from "@remix-run/cloudflare";
import { ClientLoaderFunction, Outlet } from "@remix-run/react";
import { initLiff } from "~/lib/liff";

export const clientLoader: ClientLoaderFunction = async () => {
  await initLiff();
  return json({});
};
export default function BookingLayout() {
  return (
    <div className="flex flex-col h-screen justify-center">
      <Outlet />
    </div>
  );
}
