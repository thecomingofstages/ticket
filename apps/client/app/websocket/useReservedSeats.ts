import { initConnect } from "./lib/initConnect";
import { SeatStatus, WSClientEvents, WSServerEvents, client } from "~/rpc";
import useSWR from "swr";
import { useCallback, useEffect, useRef, useState } from "react";

type WebSocketConnectionState = { room: string } & (
  | {
      status: "connected";
    }
  | {
      status: "disconnected";
      error?: Error;
    }
);
export const useReservedSeats = ({ room }: { room: string }) => {
  // we use swr instead of plain state
  // so that on prefetch we can fill initial data from the server, if we want
  // and the state can survive across renders!
  const { data, mutate } = useSWR<Record<string, SeatStatus>>(
    ["seats", room],
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

  const ws = useRef<WebSocket | null>(null);
  const [connect, setConnect] = useState<WebSocketConnectionState>({
    room,
    status: "disconnected",
  });

  const initWsConnect = useCallback(
    async (signal: AbortSignal, room: string) => {
      try {
        const token = await initConnect(signal);
        const url = client.ws[":token"].ticket[":room"].$url({
          param: { token, room },
        });
        if (ws.current) {
          ws.current.close();
        }
        ws.current = new WebSocket(`ws://${url.host}${url.pathname}`);
        ws.current.addEventListener("close", () => {
          // console.log("Server close connect", event);
          ws.current = null;
          setConnect({
            status: "disconnected",
            room,
            error: new Error("Websocket Connection Error"),
          });
        });
        ws.current.addEventListener("error", () => {
          // console.log("Server error connect", event);
          setConnect({
            status: "disconnected",
            error: new Error("Websocket Connection Error"),
            room,
          });
          ws.current = null;
        });
        ws.current.addEventListener("open", () => {
          setConnect({ status: "connected", room });
        });
        ws.current.addEventListener("message", (event) => {
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
      } catch (err) {
        if (typeof err === "string" && err === "Unmount") return;
        throw err;
      }
    },
    [mutate]
  );

  useEffect(() => {
    const abortController = new AbortController();
    // console.log(connect, room, connect.room !== room);
    if (connect.status === "disconnected" && !connect.error) {
      // console.log("Will connect", "reason: not currently connected");
      initWsConnect(abortController.signal, room);
    } else if (connect.room !== room) {
      // console.log("Will connect", "reason: room changed");
      initWsConnect(abortController.signal, room);
    }
    return () => {
      abortController.abort("Unmount");
    };
  }, [connect, initWsConnect, room]);

  const updateSeat = useCallback(({ seat }: { seat: string }) => {
    if (!ws.current) return;
    ws.current.send(
      JSON.stringify({ type: "toggleSeat", seat } satisfies WSServerEvents)
    );
  }, []);

  return {
    data,
    updateSeat,
  };
};
