import { useRouteLoaderData } from "@remix-run/react";
import type { clientLoader } from "../routes/me.ticket";

type Return = ReturnType<typeof useMyTicket>;
type NormalTransaction = Return["data"][number];
type TransferTransaction = Return["transfers"][number];

export type Transaction = NormalTransaction | TransferTransaction;
export type Seat = Transaction["seats"][number];

export const useMyTicket = () => {
  const ticket = useRouteLoaderData<typeof clientLoader>("routes/me.ticket");
  if (!ticket) {
    throw new Error("Cannot get ticket");
  }
  const { data, transfers } = ticket;
  return { data, transfers };
};
