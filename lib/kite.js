import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { KiteConnect } from "kiteconnect";

export const SESSION_COOKIE = "zeta_gain_session";

export function requireEnvironment() {
  const missing = ["KITE_API_KEY", "KITE_API_SECRET", "JWT_SECRET"].filter(
    (key) => !process.env[key]
  );
  if (missing.length) {
    const error = new Error(`Missing server configuration: ${missing.join(", ")}`);
    error.statusCode = 503;
    throw error;
  }
}

export function createKite(accessToken) {
  if (!process.env.KITE_API_KEY) {
    const error = new Error("KITE_API_KEY is not configured");
    error.statusCode = 503;
    throw error;
  }
  const kite = new KiteConnect({ api_key: process.env.KITE_API_KEY });
  if (accessToken) kite.setAccessToken(accessToken);
  return kite;
}

export function createSession(payload) {
  requireEnvironment();
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "23h" });
}

export async function getSession() {
  if (!process.env.JWT_SECRET) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getAuthenticatedKite() {
  const session = await getSession();
  if (!session?.accessToken) {
    const error = new Error("Your Zerodha session has expired. Please sign in again.");
    error.statusCode = 401;
    throw error;
  }
  return createKite(session.accessToken);
}

export function apiError(error) {
  console.error(error);
  return Response.json(
    { error: error.message || "Unexpected server error" },
    { status: error.statusCode || 500 }
  );
}
