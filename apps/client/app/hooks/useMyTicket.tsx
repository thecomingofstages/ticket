import { useRouteLoaderData } from "@remix-run/react";
import type { clientLoader } from "../routes/me.ticket";

export type Transaction = ReturnType<typeof useMyTicket>[number];
export type Seat = Transaction["seats"][number];

export const useMyTicket = () => {
  const ticket = useRouteLoaderData<typeof clientLoader>("routes/me.ticket");
  if (!ticket) {
    throw new Error("Cannot get ticket");
  }
  return ticket.data;
};
