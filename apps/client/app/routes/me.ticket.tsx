import { json } from "@remix-run/cloudflare";
import { initLiff } from "~/lib/liff";
import { client } from "~/rpc";

export const clientLoader = async () => {
  await initLiff();
  const data = await client.api.ticket.$get();
  if (data.status === 200) {
    return json(await data.json());
  }
  throw new Error("Invalid response");
};

export default function MyTicket() {
  return <span>My Ticket!</span>;
}
