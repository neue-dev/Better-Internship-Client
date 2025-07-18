// firebaseClient.ts
import { useEffect, useState } from "react";
import { APIClient, APIRoute } from "./api/api-client";
import PocketBase, { AuthRecord } from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_CHAT_URL as string);

/**
 * Make the API easier to deal with.
 *
 * @returns
 */
export const usePocketbase = (type: "user" | "employer") => {
  const [user, setUser] = useState<AuthRecord>(null);

  const auth = async () => {
    // Already authed
    if (pb.authStore.record) {
      setUser(pb.authStore.record);
      return;
    }

    // Request token
    const route =
      type === "employer"
        ? APIRoute("conversations").r("auth/hire").build()
        : APIRoute("conversations").r("auth").build();
    const { token, user } = await APIClient.post<{
      token: string;
      user: AuthRecord;
    }>(route);
    pb.authStore.save(token, user);

    // Save state
    setUser(user);
  };

  useEffect(() => {
    auth();
  }, []);

  return {
    pb,
    user,
  };
};
