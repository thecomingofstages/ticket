import { initConnect } from "./lib/initConnect";
import { SeatStatus, WSClientEvents, WSServerEvents, client } from "~/rpc";
import useSWR from "swr";
import { useCallback, useEffect, useMemo } from "react";
import useSWRSubscription from "swr/subscription";

export type UseReservedSeats = {
  round: string;
  updateSeat: (args: { seat: string }) => void;
} & (
  | {
      loaded: true;
      seats: Record<string, SeatStatus>;
      ownedSeats: string[];
    }
  | {
      loaded: false;
    }
);

export const useReservedSeats = ({
  round,
}: {
  round: string;
}): UseReservedSeats => {
  // we use swr instead of plain state
  // so that on prefetch we can fill initial data from the server, if we want
  // and the state can survive across renders!
  const { data, mutate } = useSWR<Record<string, SeatStatus>>(
    [round, "seats"],
    () => {
      return {};
    },
    {
      revalidateOnMount: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // connectToken will only fetched once
  // and will refetch if disconnected or error on the server
  const { data: connectToken, mutate: refreshToken } = useSWR(
    [round, "ws", "token"],
    async () => initConnect(),
    {
      refreshWhenOffline: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      refreshWhenHidden: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // holds the current websocket connection state
  // still use swr so that we can benefit from
  // automatic cleanup when deps changed
  const { data: ws, error: wsError } = useSWRSubscription<
    WebSocket,
    { status: "closed" } | { status: "error"; error: Event },
    [string, "ws", string] | null
  >(
    connectToken ? [round, "ws", connectToken] : null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([room, _, token], { next }) => {
      let ws: WebSocket | null = null;
      const url = client.ws[":token"].ticket[":room"].$url({
        param: { token, room },
      });
      ws = new WebSocket(`ws://${url.host}${url.pathname}`);
      ws.addEventListener("close", () => {
        next({ status: "closed" });
      });
      ws.addEventListener("error", (event) => {
        next({ status: "error", error: event });
      });
      ws.addEventListener("open", () => {
        next(undefined, ws!);
        // ready! mount the value!
        mutate();
      });
      ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data) as WSClientEvents;
        console.log("message", message);
        if (message.type === "seatChanged") {
          mutate((seats) => {
            return {
              ...(seats ?? {}),
              [message.seat]: message.status,
            };
          }, false);
        } else if (message.type === "seatsChanged") {
          mutate((seats) => {
            return message.seats.reduce((acc, seat) => {
              return {
                ...acc,
                [seat]: message.status,
              };
            }, seats ?? {});
          }, false);
        }
      });

      return () => {
        ws?.close();
      };
    }
  );

  useEffect(() => {
    if (wsError?.status === "error") {
      // try reconnect to the server
      refreshToken();
    }
  }, [refreshToken, wsError]);

  const updateSeat = useCallback(
    ({ seat }: { seat: string }) => {
      if (!ws) return;
      ws.send(
        JSON.stringify({ type: "toggleSeat", seat } satisfies WSServerEvents)
      );
    },
    [ws]
  );

  const ownedSeats = useMemo(() => {
    if (!data) return [];
    const seats = [];
    for (const [seat, status] of Object.entries(data)) {
      if (status === "selected") {
        seats.push(seat);
      }
    }
    return seats;
  }, [data]);

  if (!ws || !data) {
    return {
      round,
      loaded: false,
      updateSeat,
    };
  }

  return {
    round,
    loaded: true,
    seats: data,
    ownedSeats,
    updateSeat,
  };
};
