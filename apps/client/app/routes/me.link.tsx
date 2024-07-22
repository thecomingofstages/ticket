import { ClientLoaderFunctionArgs, json, redirect } from "@remix-run/react";
import { initLiff } from "~/lib/liff";
import { client } from "~/rpc";

export { meta } from "./me.ticket._index";

export const clientLoader = async ({ request }: ClientLoaderFunctionArgs) => {
  await initLiff();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    throw new Error("Missing id");
  }
  const response = await client.api.linkProvider[":id"].$put({ param: { id } });
  console.log(response);
  if (response.status === 200 || response.status === 409) {
    // success link or already linked
    return redirect("/me/ticket");
  } else {
    // failed to link
    const { message } = await response.json();
    throw json({ success: false, message }, response.status);
  }
};
export default function ConnectAccount() {
  return null;
}
