"use server";

import { getSession } from "@/lib/auth";

export async function getSessionInfo() {
  const session = await getSession();
  if (!session) {
    return { name: "", username: "" };
  }
  return {
    name: session.name,
    username: session.username,
  };
}
