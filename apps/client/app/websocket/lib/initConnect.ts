import { client } from "~/rpc";

export const initConnect = async (signal: AbortSignal) => {
  const init = await client.ws.connect
    .$post(undefined, {
      init: {
        signal,
      },
    })
    .then((c) => c.json());
  return init.token;
};
