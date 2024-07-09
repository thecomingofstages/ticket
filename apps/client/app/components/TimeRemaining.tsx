import { useEffect, useRef, useState } from "react";
import { intervalToDuration } from "date-fns";

export const TimeRemaining = ({ expiration }: { expiration?: Date }) => {
  const [curDate, setCurDate] = useState(new Date());
  const timer = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!expiration) return;
    const update = () => {
      setCurDate(new Date());
    };
    update();
    timer.current = setInterval(update, 1000);
    return () => clearInterval(timer.current);
  }, [expiration]);
  if (!expiration) return null;
  const diff = intervalToDuration({
    start: curDate,
    end: expiration,
  });
  const minutes = diff.minutes && diff.minutes > 0 ? diff.minutes : 0;
  const seconds = diff.seconds && diff.seconds > 0 ? diff.seconds : 0;
  return (
    <div className="text-xs text-zinc-400">
      {minutes === 0 && seconds === 0 ? (
        <>หมดเวลาการทำรายการ</>
      ) : (
        <>
          เหลือเวลา {minutes} นาที {seconds} วินาที
        </>
      )}
    </div>
  );
};
