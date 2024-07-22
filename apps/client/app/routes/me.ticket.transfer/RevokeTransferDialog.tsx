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

export default function RevokeTransferDialog({
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
            ต้องการยกเลิกคำขอโอนบัตรใช่หรือไม่
          </AlertDialogTitle>
          <AlertDialogDescription>
            ระบบจะยกเลิกคำขอโอนบัตร<b>{seatString}</b>{" "}
            โดยคำขอที่ถูกส่งไปแล้วจะไม่สามารถใช้งานได้อีก
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>กลับ</AlertDialogCancel>
          <AlertDialogAction variant={"destructive"} onClick={onConfirm}>
            ยกเลิกคำขอ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
