import { useRouteLoaderData } from "@remix-run/react";
import type { clientLoader } from "../routes/me";
import { client } from "~/rpc";
import { InferResponseType } from "hono";

type Profile = InferResponseType<(typeof client)["api"]["profile"]["$get"]>;

export const useProfile = () => {
  const profile = useRouteLoaderData<typeof clientLoader>("routes/me");
  if (!profile) {
    throw new Error("Cannot get profile");
  }
  if (!profile.data) {
    throw new Error("Profile data not linked.");
  }
  return profile as Required<Profile>;
};
