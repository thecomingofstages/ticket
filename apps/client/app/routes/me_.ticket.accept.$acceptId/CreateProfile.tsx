import { Button } from "~/components/ui/button";
import logo from "~/images/logo-white.png";
import { ProfileForm } from "../booking.$round.confirm/Form";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ProfileFormSchema,
  profileForm,
} from "../booking.$round.confirm/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { client } from "~/rpc";
import { useRevalidator } from "@remix-run/react";
import { useEffect, useState } from "react";
import liff from "@line/liff";

export default function CreateProfileFallback() {
  const form = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileForm),
    defaultValues: {
      department: "",
      lineDisplayName: "",
    },
  });
  const { revalidate, state } = useRevalidator();

  useEffect(() => {
    liff.getProfile().then(({ displayName }) => {
      form.setValue("lineDisplayName", displayName);
    });
  }, [form]);

  const [submiting, isSubmiting] = useState(false);
  const onSubmit: SubmitHandler<ProfileFormSchema> = async (data) => {
    isSubmiting(true);
    try {
      await client.api.profile.$post({ json: data });
      isSubmiting(false);
      revalidate();
    } catch (err) {
      isSubmiting(false);
      revalidate();
      console.error(err);
    }
  };

  const loading = submiting || state === "loading";
  return (
    <div className="flex flex-col space-y-4 p-6">
      <header className="space-y-3">
        <img src={logo} alt="Logo" width={100} height={100} />
        <h1 className="font-bold text-2xl">ลงทะเบียนเพื่อรับบัตร</h1>
        <p className="text-zinc-300 text-sm">
          กรุณาลงทะเบียนเพื่อรับคำขอโอนบัตรเข้าชมการแสดงละครเวทีเรื่อง
          &quot;Hansel and Gratel : Home Sweet Home The Musical&quot;
        </p>
      </header>

      <ProfileForm form={form} />
      <p className="text-red-400 text-sm">
        ทางโครงการ The Coming of Stages ไม่มีนโยบายในการซื้อ-ขายบัตร
        นอกจากช่องทางที่ได้ประกาศไว้อย่างเป็นทางการเท่านั้น
        หากเกิดความเสียหายจะไม่รับผิดชอบทุกกรณี
      </p>

      <div className="grid grid-cols-2 gap-2.5 py-1">
        <Button disabled={loading} variant={"secondary"}>
          ยกเลิก
        </Button>
        <Button disabled={loading} onClick={form.handleSubmit(onSubmit)}>
          {loading ? "กำลังโหลด..." : "ดำเนินการต่อ"}
        </Button>
      </div>
    </div>
  );
}
