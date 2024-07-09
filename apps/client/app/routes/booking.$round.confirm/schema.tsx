import { z } from "zod";

export const profileForm = z.object({
  name: z.string().min(3),
  surname: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  department: z.string(),
  lineDisplayName: z.string(),
});

export type ProfileFormSchema = z.infer<typeof profileForm>;
