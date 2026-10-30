import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { KiteConnect } from "kiteconnect";

export const SESSION_COOKIE = "zeta_gain_session";

export function requireEnvironment() {
  const missing = ["KITE_API_KEY", "KITE_API_SECRET", "JWT_SECRET"].filter(
    (key) => !process.env[key]?.trim()
  );
  if (missing.length) {
    const error = new Error(`Missing server configuration: ${missing.join(", ")}`);
    error.statusCode = 503;
    throw error;
  }
}

export function createKite(accessToken) {
  const apiKey = process.env.KITE_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error("KITE_API_KEY is not configured");
    error.statusCode = 503;
    throw error;
  }
  const kite = new KiteConnect({ api_key: apiKey });
  if (accessToken) kite.setAccessToken(accessToken.trim());
  return kite;
}

export function createSession(payload) {
  requireEnvironment();
  return jwt.sign(payload, process.env.JWT_SECRET.trim(), { expiresIn: "23h" });
}

export async function getSession() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
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
  const isAuthError =
    error.statusCode === 401 ||
    error.error_type === "TokenException" ||
    error.message?.includes("Token is invalid or has expired") ||
    error.message?.includes("session has expired") ||
    error.message?.includes("Please sign in again");

  const status = isAuthError ? 401 : (error.statusCode || 500);

  return Response.json(
    {
      error: error.message || "Unexpected server error",
      error_type: error.error_type || (isAuthError ? "TokenException" : "ServerError"),
    },
    { status }
  );
}
