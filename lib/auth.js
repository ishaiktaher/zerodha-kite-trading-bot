import { getSession } from "@/lib/kite";

export async function requireSession() {
  const session = await getSession();
  if (!session?.userId || !session?.accessToken) {
    const error = new Error("Your Zerodha session has expired. Please sign in again.");
    error.statusCode = 401;
    throw error;
  }
  return session;
}

