import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
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
  const { data } = useLoaderData<typeof clientLoader>();
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

      <div className="flex-1 flex-grow overflow-y-auto">
        <div className="flex flex-col gap-6 flex-1 flex-grow p-5 leading-7">
          <div className="space-y-5">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">รายการที่นั่งของฉัน</h2>
              <p className="text-sm leading-5 text-zinc-300">
                หากมีที่นั่งใดไม่ถูกต้อง โปรดแจ้งทาง LINE Official Account
              </p>
            </div>
            {data.map((tr) =>
              tr.seats.map((seat) => (
                <div
                  key={`${tr.id}:${seat.id}`}
                  data-testkey={`${tr.id}:${seat.id}`}
                  className="flex flex-row w-full"
                >
                  <div className="bg-white text-black flex flex-col items-center justify-center p-4 rounded-l-lg">
                    <span className="text-sm text-zinc-700">รอบ</span>
                    <b className="text-xl">{tr.round}:00</b>
                  </div>
                  <div className="bg-white/10 flex flex-col flex-grow p-4 rounded-r-lg space-y-0.5">
                    <b>ที่นั่ง {seat.seat}</b>
                    <span className="text-xs text-zinc-300 pb-3">
                      ทำรายการเมื่อ{" "}
                      {new Date(tr.submittedAt).toLocaleString("th-TH")}
                    </span>
                    <Button variant={"secondary"} disabled size={"sm"}>
                      ยังไม่ถึงเวลางาน
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
