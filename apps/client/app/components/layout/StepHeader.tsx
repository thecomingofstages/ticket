import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { Header } from "./Header";

export const StepHeader = ({
  no,
  title,
  description,
  backUrl,
}: {
  no: number;
  title: string;
  description?: string;
  backUrl?: string;
}) => {
  return (
    <Header>
      {backUrl && (
        <Link
          to={backUrl}
          className="flex items-center justify-center flex-shrink-0"
        >
          <ArrowLeft className="w-8 h-8" />
        </Link>
      )}
      <div className="flex flex-col flex-shrink-0 items-center">
        <span className="text-sm">ขั้นตอนที่</span>
        <b className="text-2xl">{no}</b>
      </div>
      <div className="flex flex-col flex-grow justify-center gap-0.5">
        <b className="text-lg">{title}</b>
        <p className="text-zinc-300 text-sm">{description}</p>
      </div>
    </Header>
  );
};
