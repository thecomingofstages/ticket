import { Link, useOutletContext } from "@remix-run/react";
import { StepHeader } from "~/components/layout/StepHeader";
import { UseReservedSeats } from "~/websocket/useReservedSeats";
import { OwnedSeats } from "./OwnedSeats";
import BottomFooter from "~/components/layout/BottomFooter";
import { ProfileForm } from "./Form";
import { useForm } from "react-hook-form";
import { ProfileFormSchema } from "./schema";

export default function SeatingConfirm() {
  const ctx = useOutletContext<UseReservedSeats>();
  const form = useForm<ProfileFormSchema>({
    defaultValues: {
      department: "",
      lineDisplayName: "sz.",
    },
  });
  if (!ctx.loaded) return null;
  return (
    <>
      <StepHeader
        no={3}
        title={"รายละเอียดคำสั่งซื้อ"}
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
        <div className="flex flex-col flex-grow gap-1 leading-5">
          <b>ยืนยันและไปยังขั้นตอนชำระเงิน</b>
          <span className="text-xs text-zinc-400">
            โปรดชำระเงินภายใน 10 นาทีหลังจากยืนยันคำสั่งซื้อ
          </span>
        </div>
        <div className="flex items-center flex-shrink-0">
          {ctx.loaded && (
            <Link
              to={`/booking/${ctx.round}/confirm`}
              className={`px-4 py-2 bg-white text-black rounded-lg ${
                ctx.ownedSeats.length > 0 ? "opacity-100" : "opacity-0"
              } duration-150`}
            >
              ยืนยันและชำระเงิน
            </Link>
          )}
        </div>
      </BottomFooter>
    </>
  );
}
