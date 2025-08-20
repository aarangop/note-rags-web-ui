import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession();
}

export function getAccessToken(
  session: { accessToken?: string } | null
): string | null {
  return session?.accessToken || null;
}
