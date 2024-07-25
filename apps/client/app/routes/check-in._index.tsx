import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import {
  Form,
  isRouteErrorResponse,
  redirect,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { server } from "~/rpc.server";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef } from "react";
import { verifyTurnstile } from "../lib/turnstile.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    throw json({ success: false }, 400);
  }
  const form = await request.formData();
  const turnstile = form.get("cf-turnstile-response");
  const ip = request.headers.get("CF-Connecting-IP");
  if (typeof turnstile !== "string" || !verifyTurnstile(turnstile, ip)) {
    return json({
      success: false,
      message: "Fail to verify CAPTCHA.",
    } as const);
  }
  const res = await server.checkIn[":token"].$post({
    param: { token },
    json: {
      userId: form.get("userId") as string,
      password: form.get("password") as string,
    },
  });
  if (res.status === 200) {
    const { seatId } = await res.json();
    return redirect("/check-in/success?seatId=" + seatId);
  } else if (res.status === 401) {
    return json({
      success: false,
      message: "Login failed.",
    } as const);
  } else {
    const data = await res.json();
    throw json(data, res.status);
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) throw json({ success: false }, 400);
  const res = await server.checkIn[":token"].$get({ param: { token } });
  if (res.status === 200) {
    const data = await res.json();
    return json(data);
  } else {
    const data = await res.json();
    throw json(data, res.status);
  }
};

export default function CheckInIndex() {
  const ref = useRef<TurnstileInstance>();
  const { data } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  useEffect(() => {
    ref.current?.reset();
  }, [result]);
  return (
    <>
      <section className="bg-white/10 p-4 rounded-sm space-y-4">
        <b className="text-xl">Seat Details</b>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <b>Round</b>
            <span className="text-zinc-300">{data.round}</span>
            <b>Seat</b>
            <span className="text-zinc-300">{data.seat}</span>
          </div>
        </div>
      </section>
      <section className="bg-white/10 p-4 rounded-sm space-y-3">
        <b className="text-xl">Authentication</b>
        <p className="text-zinc-300 py-1">
          To check-in this ticket, please enter your credentials.
        </p>
        <Form method="post" className="space-y-3">
          {result?.success === false && (
            <p className="text-red-400">{result.message}</p>
          )}
          <div className="space-y-3">
            <Label>Username</Label>
            <Input name="userId" type="tel" inputMode="numeric" />
          </div>
          <div className="space-y-3">
            <Label>PIN</Label>
            <Input
              name="password"
              type="password"
              inputMode="numeric"
              pattern="^[0-9]{1,}$"
            />
          </div>
          <div className="flex items-center justify-center">
            <Turnstile
              ref={ref}
              options={{ theme: "dark" }}
              siteKey={import.meta.env.VITE_TURNSTILE_SITEKEY}
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </Form>
      </section>
    </>
  );
}
