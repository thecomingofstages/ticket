import { cn } from "~/lib/utils";
import type { SeatStatus } from "../../../server/src/events";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

type ChildrenProps = {
  children: React.ReactNode;
};

const SeatPicker = ({
  children,
  initialScrollToSeat,
}: ChildrenProps & {
  /**
   * Scrolls to the given seat on initial page load.
   * Will apply on back-forward navigations only, not on first page load.
   */
  initialScrollToSeat?: string;
}) => {
  const scroller = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!scroller.current) return;
    if (initialScrollToSeat) {
      const seat = scroller.current.querySelector<HTMLButtonElement>(
        `button[data-seat="${initialScrollToSeat}"]`
      );
      if (seat) {
        seat.scrollIntoView({ inline: "center", block: "center" });
        return;
      }
    }
    scroller.current.scrollIntoView({ inline: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="overflow-auto flex-grow flex-1 flex">
      <div
        ref={scroller}
        className="w-fit h-full min-h-[400px] flex flex-grow flex-col gap-3 p-8 items-center justify-center relative"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] min-w-[400px] border-b border-white/70 rotate-90"></div>
        {children}
      </div>
    </div>
  );
};

const SeatPickerStage = () => {
  return (
    <div className="py-6 w-full z-20">
      <div className="w-full flex items-center justify-center bg-blue-500 text-2xl font-bold px-8 py-12">
        STAGE
      </div>
    </div>
  );
};

const SeatPickerRow = ({ children }: ChildrenProps) => {
  return <div className="flex flex-row gap-3">{children}</div>;
};

const SeatPickerSeat = ({
  seat,
  status,
  onClick,
}: {
  seat: string;
  status?: SeatStatus;
  onClick?: () => void;
}) => {
  return (
    <button
      data-seat={seat}
      onClick={onClick}
      className={cn(
        "h-14 w-14",
        status === "available" && "bg-purple-800",
        (status === "selected" || !status) && "bg-purple-400",
        status === "reserved" && "bg-red-600",
        "transition-colors duration-100 rounded-full relative"
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center font-medium text-lg">
        {seat}
      </div>
      {status && status !== "available" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-white/10">
          {status === "selected" && (
            <Check strokeWidth={4} className="h-6 w-6 text-purple-900" />
          )}
        </div>
      )}
    </button>
  );
};

const SeatPickerGap = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="flex items-center justify-center px-8 opacity-75"
      // style={{
      //   writingMode: "vertical-lr",
      //   textOrientation: "mixed",
      // }}
    >
      {children}
    </div>
  );
};

SeatPicker.Stage = SeatPickerStage;
SeatPicker.Row = SeatPickerRow;
SeatPicker.Seat = SeatPickerSeat;
SeatPicker.Gap = SeatPickerGap;

export { SeatPicker };
