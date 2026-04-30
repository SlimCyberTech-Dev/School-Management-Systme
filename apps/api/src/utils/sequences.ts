import type { PoolClient } from "pg";

/** Atomic next sequence value; first value is 1 */
export async function nextSequence(
  client: { query: PoolClient["query"] },
  key: string,
): Promise<number> {
  const { rows } = await client.query<{ value: string }>(
    `INSERT INTO _sequences (name, value) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET value = _sequences.value + 1
     RETURNING value`,
    [key],
  );
  return Number(rows[0]!.value);
}

export function padNumber(n: number, width: number): string {
  return String(n).padStart(width, "0");
}
