import { z } from "zod";

export const profileForm = z.object({
  name: z.string({
    required_error: "กรุณากรอกชื่อ",
  }),
  surname: z.string({
    required_error: "กรุณากรอกนามสกุล",
  }),
  email: z
    .string({
      required_error: "กรุณากรอกอีเมล",
    })
    .email({
      message: "รูปแบบอีเมลไม่ถูกต้อง",
    }),
  phone: z.string({
    required_error: "กรุณากรอกเบอร์โทรศัพท์",
  }),
  department: z.string({
    required_error: "กรุณาเลือกฝ่าย",
  }),
  lineDisplayName: z.string(),
});

export type ProfileFormSchema = z.infer<typeof profileForm>;
