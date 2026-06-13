import "dotenv/config";
import { pool, tenantContext } from "../src/config/db";
import { getDefaultTenantId } from "../src/config/tenant";
import { seedDefaultGradingScales } from "../src/modules/academic/gradingScaleMaintenance";

/**
 * Seeds or refreshes default O-Level and A-Level grading scales.
 *
 * Usage:
 *   npm run seed:grading-scales
 *   npm run seed:grading-scales -- --level=A_LEVEL
 *   npm run seed:grading-scales -- --reset
 *   npm run seed:grading-scales -- --all-tenants
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const allTenants = args.includes("--all-tenants");
  const levelArg = args.find((a) => a.startsWith("--level="))?.split("=")[1];

  const levels =
    levelArg === "O_LEVEL" || levelArg === "A_LEVEL"
      ? ([levelArg] as const)
      : (["A_LEVEL", "O_LEVEL"] as const);

  const tenantIds = allTenants
    ? (
        await pool.query<{ id: string }>(`SELECT id FROM tenants ORDER BY slug`)
      ).rows.map((r) => r.id)
    : [await getDefaultTenantId()];

  let totalInserted = 0;
  for (const tenantId of tenantIds) {
    const result = await tenantContext.run(tenantId, () =>
      seedDefaultGradingScales({
        levels: [...levels],
        reset,
      }),
    );
    totalInserted += result.inserted;
    console.log(`Tenant ${tenantId}: ${result.inserted} row operations`);
  }

  console.log(
    `Grading scales seeded for ${levels.join(", ")} (${totalInserted} row operations total, reset=${reset}).`,
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
