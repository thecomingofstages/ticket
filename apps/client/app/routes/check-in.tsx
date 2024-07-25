import { MetaFunction } from "@remix-run/cloudflare";
import { Outlet, isRouteErrorResponse, useRouteError } from "@remix-run/react";
import logo from "~/images/logo-white.png";

export const meta: MetaFunction = () => [
  {
    title: "Ticket Check-in : TCOS Booking System",
  },
];

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex flex-col space-y-3 p-6">
      <img src={logo} alt="Logo" width={100} height={100} />
      <h1 className="font-bold text-2xl">Cannot proceed your request</h1>

      <p className="text-zinc-300 text-sm">
        {isRouteErrorResponse(error) ? (
          <>
            {error.status === 401 || error.status === 403
              ? "Unauthorized. You don't have permission to view this page."
              : error.status === 400
              ? "Bad request. The requested resource was not found, expired or already used."
              : "Server side exception : " + error.data.message ??
                "Please try again later."}
          </>
        ) : (
          <>
            Client side exception :{" "}
            {error instanceof Error ? error.message : ""}
          </>
        )}
      </p>
    </div>
  );
}

export default function CheckInAppLayout() {
  return (
    <div className="flex flex-col space-y-4 p-6">
      <header className="space-y-3">
        <img src={logo} alt="Logo" width={100} height={100} />
        <h1 className="font-bold text-2xl">Ticket Check-in</h1>
      </header>
      <Outlet />
    </div>
  );
}
