import liff from "@line/liff";

let initPromise: Promise<void> | null = null;

const _initLiff = async () => {
  await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
  if (!liff.isInClient()) {
    if (import.meta.env.PROD) {
      throw new Error("Cannot run outside LINE app");
    }
    console.warn(
      "[LIFF] Running in external browser. Authentication might work weirdly."
    );
  }
  if (!liff.isLoggedIn()) {
    liff.login();
  }
};

export const initLiff = () => {
  if (initPromise) {
    return initPromise;
  }
  initPromise = _initLiff();
  return initPromise;
};

export { liff };
