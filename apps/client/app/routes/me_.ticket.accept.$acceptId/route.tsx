import {
  ClientLoaderFunctionArgs,
  MetaFunction,
  isRouteErrorResponse,
  json,
  useLoaderData,
  useNavigate,
  useRevalidator,
  useRouteError,
} from "@remix-run/react";
import { TicketListItem } from "~/components/TicketList";
import { Button } from "~/components/ui/button";
import { initLiff } from "~/lib/liff";
import { client } from "~/rpc";
import logo from "~/images/logo-white.png";
import { UserCircle } from "lucide-react";
import { lazy, useEffect, useState } from "react";
import { Spinner } from "~/components/layout/Spinner";

const CreateProfileFallback = lazy(() => import("./CreateProfile"));

export const meta: MetaFunction = () => [
  { title: "รับคำขอโอนบัตร : TCOS Ticket Booking" },
];

export function HydrateFallback() {
  return (
    <div className="flex flex-col h-screen justify-center">
      <Spinner text="อีกอึดใจเดียว..." />
    </div>
  );
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  const { acceptId } = params as { acceptId: string };
  await initLiff();
  const res = await client.api.seatTransfer[":acceptId"].$get({
    param: { acceptId },
  });
  if (res.status === 200) {
    const { data } = await res.json();
    return json({ success: true, data, acceptId } as const);
  } else if (res.status === 403) {
    return json({ success: false } as const);
  } else {
    const { message } = await res.json();
    throw json({ success: false, message }, res.status);
  }
};

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex flex-col space-y-3 p-6">
      <img src={logo} alt="Logo" width={100} height={100} />
      <h1 className="font-bold text-2xl">ไม่สามารถรับคำขอโอนบัตร</h1>

      <p className="text-zinc-300 text-sm">
        {isRouteErrorResponse(error) ? (
          <>
            เซิร์ฟเวอร์แจ้งข้อผิดพลาด {error.status}{" "}
            {error.data?.message ?? "โปรดแจ้ง LINE Official Account"}
          </>
        ) : (
          <>ระบบเกิดข้อผิดพลาด {error instanceof Error ? error.message : ""}</>
        )}
      </p>
    </div>
  );
}

const UserView = ({
  name,
  department,
  phone,
  picture,
}: {
  name: string;
  department: string;
  phone: string;
  picture?: string;
}) => {
  return (
    <div className="rounded-lg bg-white/10 p-4 flex flex-row gap-4 items-center">
      {picture ? (
        <img
          alt={"Profile"}
          src={picture}
          width={60}
          height={60}
          className="rounded-full"
        />
      ) : (
        <UserCircle strokeWidth={1.5} className="w-[60px] h-[60px]" />
      )}
      <div className="flex flex-col">
        <b className="text-sm pb-0.5">{name}</b>
        <span className="text-xs">{department}</span>
        <span className="text-xs">{phone}</span>
      </div>
    </div>
  );
};

export default function TicketAccept() {
  const data = useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!data.success) {
    return <CreateProfileFallback />;
  }

  const {
    data: { owner, createdAt, seats, user },
    acceptId,
  } = data;

  const accept = async () => {
    try {
      setLoading(true);
      const res = await client.api.seatTransfer[":acceptId"].accept.$post({
        param: { acceptId },
      });
      setLoading(false);
      if (res.status === 200) {
        return navigate("/me/ticket", {
          replace: true,
        });
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    } finally {
      revalidate();
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-6">
      <header className="space-y-3">
        <img src={logo} alt="Logo" width={100} height={100} />
        <h1 className="font-bold text-2xl">คำขอโอนสิทธิ์เจ้าของบัตร</h1>
        <p className="text-zinc-300 text-sm">
          คุณได้รับคำขอโอนบัตรเข้าชมการแสดงละครเวทีเรื่อง &quot;Hansel and
          Gratel : Home Sweet Home The Musical&quot;
        </p>
      </header>
      <b>จากบัญชีเจ้าของบัตร</b>
      <UserView {...owner} />
      <b>มายังบัญชีของคุณ</b>
      <UserView {...user} />
      <b>รายการที่นั่งที่โอน</b>
      <div className="space-y-3">
        {seats.map((seat) => (
          <TicketListItem
            key={seat.id}
            tr={{
              createdAt: createdAt,
              submittedAt: null,
              isTransfered: false,
            }}
            seat={seat}
          />
        ))}
      </div>
      <p className="text-zinc-300 text-sm pt-1">
        หากคุณยอมรับการโอนนี้ บัตรที่นั่งจะถูกโอนมายังบัญชีของคุณ
        และคุณสามารถจัดการบัตรเข้าชมได้ผ่านทาง LINE Official Account{" "}
        <b>TCOS Ticket Booking</b>
      </p>
      <p className="text-red-400 text-sm">
        ทางโครงการ The Coming of Stages ไม่มีนโยบายในการซื้อ-ขายบัตร
        นอกจากช่องทางที่ได้ประกาศไว้อย่างเป็นทางการเท่านั้น
        หากเกิดความเสียหายจะไม่รับผิดชอบทุกกรณี
      </p>
      <div className="grid grid-cols-2 gap-2.5 py-1">
        <Button disabled={loading} variant={"secondary"}>
          ปฏิเสธ
        </Button>
        <Button disabled={loading} onClick={accept}>
          {loading ? "กำลังโหลด..." : "ยอมรับ"}
        </Button>
      </div>
    </div>
  );
}
