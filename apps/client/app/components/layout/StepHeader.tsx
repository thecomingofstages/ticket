import { XIcon } from "lucide-react";

export const StepHeader = ({
  no,
}: //   children,
{
  no: number;
  //   children: React.ReactNode;
}) => {
  return (
    <header className="flex flex-row gap-6 bg-zinc-900 border-zinc-600 border-b px-5 py-4">
      <div className="flex flex-col items-center">
        <span className="text-sm">ขั้นตอนที่</span>
        <b className="text-2xl">{no}</b>
      </div>
      <div className="flex flex-col flex-grow justify-center">
        <b className="text-2xl">เลือกที่นั่ง</b>
      </div>
      <div className="flex items-center justify-center">
        <XIcon className="w-8 h-8" />
      </div>
    </header>
  );
};
