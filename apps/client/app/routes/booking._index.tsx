import { Link } from "@remix-run/react";
import { StepHeader } from "~/components/layout/StepHeader";

const rounds = [
  {
    key: "1300",
    time: ["13:00", "15:00"],
  },
  {
    key: "1800",
    time: ["18:00", "20:00"],
  },
];
export default function SelectRoundPage() {
  return (
    <>
      <StepHeader
        no={1}
        title={"เลือกรอบการแสดง"}
        description="เลือกรอบการแสดงที่ต้องการ"
      />
      <div className="flex flex-col gap-4 flex-1 flex-grow p-5 leading-7">
        <div className="pb-2 space-y-2 leading-6">
          <p className="font-bold">
            การทำรายการจะถือว่าเสร็จสิ้นเมื่อผู้ใช้ได้ชำระเงินค่าบัตรเรียบร้อยแล้วเท่านั้น
          </p>
          <p className="text-sm text-zinc-200 leading-6">
            หากเปลี่ยนรอบการแสดงในระหว่างการทำรายการ
            ระบบจะไม่บันทึกที่นั่งที่เลือกไว้ในระบบ
            และจะถือเป็นการเริ่มต้นการทำรายการใหม่
          </p>
          <p className="text-sm text-zinc-200 leading-6">
            กรุณาศึกษาข้อมูลเพิ่มเติมเกี่ยวกับข้อกำหนดในการซื้อบัตรเข้าชมให้เข้าใจเพื่อรักษาสิทธิประโยชน์ของตัวท่านเอง
            หากเกิดข้อผิดพลาดใด ๆ โปรดแจ้งทาง LINE Official Account
          </p>
        </div>
        {rounds.map((round, index) => (
          <Link
            to={`/booking/${round.key}`}
            key={round.key}
            className="group relative flex cursor-pointer rounded-lg bg-white/10 py-4 px-5 text-white shadow-md transition focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white data-[checked]:bg-white/25"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                <div className="flex flex-col items-start space-y-1">
                  <p className="font-medium text-white">
                    รอบการแสดงที่ {index + 1}
                  </p>
                  <div className="text-sm flex gap-2 text-white/70">
                    <span>
                      เวลา {round.time[0]} - {round.time[1]} น.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
