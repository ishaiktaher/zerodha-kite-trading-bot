import { getDb } from "@/lib/db";

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getDb();
  const due = await sql`
    select id from zeta_gain.filters
    where is_active
      and run_daily_at is not null
      and run_daily_at <= (now() at time zone 'Asia/Kolkata')::time
      and not exists (
        select 1 from zeta_gain.scan_runs r
        where r.filter_id = filters.id
          and (r.run_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date
      )
  `;
  for (const filter of due) await sql`insert into zeta_gain.scan_runs (filter_id, status, error) values (${filter.id}, 'failed', 'Scheduled Kite scans require a renewable market-data provider; raw Kite access tokens are intentionally not persisted.')`;
  return Response.json({ processed: due.length, note: "Scheduler is wired; configure a renewable secondary data provider before enabling unattended scans." });
}
