import { SubmitHandler, UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { ProfileFormSchema } from "./schema";
import { DepartmentSelect } from "./DepartmentSelect";

export function ProfileForm({
  form,
}: {
  form: UseFormReturn<ProfileFormSchema>;
}) {
  return (
    <Form {...form}>
      <form className="space-y-3">
        <FormField
          control={form.control}
          name="lineDisplayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required={false}>
                บัญชี LINE ที่เข้าสู่ระบบอยู่ (กรอกอัตโนมัติ)
              </FormLabel>
              <FormControl>
                <Input readOnly {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อ</FormLabel>
              <FormControl>
                <Input placeholder="ไม่ต้องป้อนคำนำหน้าชื่อ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>นามสกุล</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field: { value, onChange, disabled } }) => (
            <FormItem>
              <FormLabel aria-required>ฝ่าย</FormLabel>
              <FormControl>
                <DepartmentSelect
                  onChange={onChange}
                  value={value}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>อีเมล</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เบอร์โทรศัพท์</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
