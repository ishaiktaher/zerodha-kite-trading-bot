import postgres from "postgres";

let client;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL is not configured. Run the Supabase migration and add its pooled Postgres URL.");
    error.statusCode = 503;
    throw error;
  }
  if (!client) client = postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20, prepare: false });
  return client;
}

export async function ensureUser(userId, sql = getDb()) {
  await sql`insert into zeta_gain.users (kite_user_id) values (${userId}) on conflict (kite_user_id) do update set updated_at = now()`;
}

export async function logOrder(entry, sql = getDb()) {
  await ensureUser(entry.userId, sql);
  const [row] = await sql`
    insert into zeta_gain.orders_log
      (user_id, kite_order_id, symbol, side, qty, price, order_type, product, status, action)
    values
      (${entry.userId}, ${entry.kiteOrderId || null}, ${entry.symbol}, ${entry.side}, ${entry.qty}, ${entry.price ?? null}, ${entry.orderType}, ${entry.product}, ${entry.status}, ${entry.action})
    returning *
  `;
  return row;
}

