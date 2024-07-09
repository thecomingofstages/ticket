import {
  MetaFunction,
  json,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { StepHeader } from "~/components/layout/StepHeader";
import { UseReservedSeats } from "~/websocket/useReservedSeats";
import { OwnedSeats } from "./OwnedSeats";
import BottomFooter from "~/components/layout/BottomFooter";
import { ProfileForm } from "./Form";
import { SubmitHandler, useForm } from "react-hook-form";
import { ProfileFormSchema, profileForm } from "./schema";
import { TimeRemaining } from "~/components/TimeRemaining";
import { Button } from "~/components/ui/button";
import { useEffect } from "react";
import { liff } from "~/lib/liff";
import { zodResolver } from "@hookform/resolvers/zod";

export const meta: MetaFunction = () => [
  {
    title: "ยืนยันคำสั่งซื้อ : TCOS Ticket System",
  },
];

export const clientLoader = async () => {
  if (import.meta.env.DEV)
    return json({
      displayName: "Test User",
      userId: "test-user",
    });
  const { displayName, userId } = await liff.getProfile();
  // console.log(liff);
  return json({ displayName, userId });
};

export default function SeatingConfirm() {
  const { displayName } = useLoaderData<typeof clientLoader>();
  const ctx = useOutletContext<UseReservedSeats>();
  const form = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileForm),
    defaultValues: {
      department: "",
      lineDisplayName: displayName,
    },
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (ctx.loaded && ctx.ownedSeats.length === 0) {
      navigate(`/booking/${ctx.round}`, {
        replace: true,
      });
    }
  }, [ctx, navigate]);

  if (!ctx.loaded) return null;

  const onSubmit: SubmitHandler<ProfileFormSchema> = async (data) => {
    if (!ctx?.loaded) return;
    ctx.persist();
    if (import.meta.env.DEV) {
      console.log(data);
      return;
    }
    await liff.sendMessages([
      {
        type: "text",
        text: `[ข้อความอัตโนมัติ] ยืนยันการจองที่นั่งรอบ ${ctx.round}
ชื่อ: ${data.name} ${data.surname}
อีเมล: ${data.email}
เบอร์โทร: ${data.phone}
ฝ่าย: ${data.department}
ที่นั่ง: ${ctx.ownedSeats.join(", ")}
เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}

โปรดรอการยืนยันจากแชทเพื่อดำเนินการชำระเงินต่อไป
`,
      },
    ]);
    liff.closeWindow();
  };

  return (
    <>
      <StepHeader
        no={3}
        title={"ยืนยันคำสั่งซื้อ"}
        description="กรุณายืนยันข้อมูลที่นั่งที่เลือกไว้"
        backUrl={`/booking/${ctx.round}`}
      />
      <div className="flex-1 flex-grow overflow-y-auto">
        <div className="flex-grow flex flex-col gap-4 px-5 py-7 leading-7">
          <OwnedSeats />
          <div className="space-y-3 flex flex-col">
            <div className="flex gap-6">
              <h1 className="font-bold text-2xl flex-grow">ข้อมูลคำสั่งซื้อ</h1>
            </div>
            <ProfileForm form={form} />
          </div>
        </div>
      </div>
      <BottomFooter className="gap-4">
        <div className="flex flex-col flex-grow justify-center gap-1 leading-5">
          <b>ยืนยันและไปยังขั้นตอนชำระเงิน</b>
          <span className="text-xs text-zinc-400">
            โปรดชำระเงินภายใน 10 นาทีหลังจากยืนยันคำสั่งซื้อ
          </span>
        </div>
        <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
          {ctx.loaded && (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              className={`px-4 py-2 bg-white text-black rounded-lg`}
            >
              ยืนยันและชำระเงิน
            </Button>
          )}
          <TimeRemaining expiration={ctx.loaded ? ctx.expiration : undefined} />
        </div>
      </BottomFooter>
    </>
  );
}
