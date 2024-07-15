import { json } from "@remix-run/cloudflare";
import { Outlet } from "@remix-run/react";
import { useProfile } from "~/hooks/useProfile";
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
  const profile = useProfile();
  return (
    <>
      <div className="bg-white/10 flex flex-row gap-4 p-6 border-b border-zinc-600">
        <img
          src={profile.providerUser.picture}
          className="w-16 h-16 rounded-full"
          alt={profile.providerUser.name}
        />
        <div className="flex flex-col justify-center space-y-0.5">
          <b>{profile.data.name}</b>
          <span className="text-xs text-zinc-300">
            {profile.data.department}
          </span>
          <span className="text-xs text-zinc-300">
            เบอร์โทรศัพท์: {profile.data.phone}
          </span>
        </div>
      </div>
      <Outlet />
    </>
  );
}
