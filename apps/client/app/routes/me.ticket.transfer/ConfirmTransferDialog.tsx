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
          <AlertDialogTitle>ต้องการส่งคำขอโอนบัตรใช่หรือไม่</AlertDialogTitle>
          <AlertDialogDescription>
            ระบบจะสร้างคำขอโอนบัตร<b>{seatString}</b> กดปุ่ม <b>ส่งคำขอ</b>{" "}
            เพื่อเลือกผู้รับใน LINE ที่ต้องการส่งคำขอ
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
