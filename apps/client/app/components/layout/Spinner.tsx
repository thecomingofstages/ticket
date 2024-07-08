import { Loader2 } from "lucide-react";

export const Spinner = ({ text = "กำลังโหลดข้อมูล..." }: { text?: string }) => {
  return (
    <div className="fixed z-[9999] inset-0 bg-black/90 flex flex-col gap-4 items-center justify-center">
      <Loader2 className="mr-2 h-10 w-10 animate-spin" />
      <span className="text-white">{text}</span>
    </div>
  );
};
