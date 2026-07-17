import { randomUUID } from "node:crypto";
import { ensureUser, getDb } from "@/lib/db";

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    conditions: row.conditions,
    conditionLogic: row.condition_logic,
    universe: row.universe,
    timeframe: row.timeframe,
    runDailyAt: row.run_daily_at?.slice?.(0, 5) || row.run_daily_at || "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFilters(userId, sql = getDb()) {
  const rows = await sql`select * from zeta_gain.filters where user_id = ${userId} order by updated_at desc`;
  return rows.map(serialize);
}

export async function saveFilter(userId, filter, sql = getDb()) {
  await ensureUser(userId, sql);
  const id = filter.id || randomUUID();
  const [row] = await sql`
    insert into zeta_gain.filters (id, user_id, name, conditions, condition_logic, universe, timeframe, run_daily_at, is_active)
    values (${id}, ${userId}, ${filter.name || "Untitled filter"}, ${sql.json(filter.conditions || [])}, ${filter.conditionLogic || "AND"}, ${filter.universe || "NIFTY_50"}, ${filter.timeframe || "day"}, ${filter.runDailyAt || null}, ${Boolean(filter.isActive)})
    on conflict (id) do update set
      name = excluded.name, conditions = excluded.conditions, condition_logic = excluded.condition_logic, universe = excluded.universe,
      timeframe = excluded.timeframe, run_daily_at = excluded.run_daily_at,
      is_active = excluded.is_active, updated_at = now()
    where zeta_gain.filters.user_id = ${userId}
    returning *
  `;
  if (!row) {
    const error = new Error("Filter was not found");
    error.statusCode = 404;
    throw error;
  }
  return serialize(row);
}

export async function deleteFilter(userId, id, sql = getDb()) {
  const rows = await sql`delete from zeta_gain.filters where id = ${id} and user_id = ${userId} returning id`;
  return rows.length > 0;
}

export async function importFilters(userId, filters, sql = getDb()) {
  const saved = [];
  for (const filter of filters.slice(0, 100)) saved.push(await saveFilter(userId, filter, sql));
  return saved;
}
