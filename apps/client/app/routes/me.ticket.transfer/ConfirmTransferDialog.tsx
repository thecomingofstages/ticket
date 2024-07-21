import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

export default function ConfirmTransferDialog({
  children,
  onConfirm,
  seatString,
}: {
  children: React.ReactNode;
  onConfirm: () => void;
  seatString: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ต้องการส่งคำขอโอนสิทธิ์เจ้าของบัตรใช่หรือไม่
          </AlertDialogTitle>
          <AlertDialogDescription>
            ระบบจะสร้างคำขอโอนสิทธิ์เจ้าของบัตรสำหรับที่นั่ง <b>{seatString}</b>{" "}
            กดปุ่ม <b>ส่งคำขอ</b> เพื่อเลือกผู้รับและส่งคำขอใน LINE
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>ส่งคำขอ</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
