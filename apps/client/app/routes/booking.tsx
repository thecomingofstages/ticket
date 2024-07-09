import { Outlet } from "@remix-run/react";

export default function BookingLayout() {
  return (
    <div className="flex flex-col h-screen justify-center">
      <Outlet />
    </div>
  );
}
