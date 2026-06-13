import "dotenv/config";
import { pool, tenantContext } from "../src/config/db";
import { getDefaultTenantId } from "../src/config/tenant";
import {
  getCurriculumStatus,
  provisionCurriculum,
  seedCurriculumCatalog,
} from "../src/modules/academic/curriculumMaintenance";

/**
 * Seeds curriculum catalogue and/or provisions class–subject slots.
 *
 * Usage:
 *   npm run seed:curriculum -- --year=<uuid> --level=O_LEVEL
 *   npm run seed:curriculum -- --year=<uuid> --level=A_LEVEL
 *   npm run seed:curriculum -- --catalog-only
 *   npm run seed:curriculum -- --all-tenants --year=<uuid> --level=O_LEVEL
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const allTenants = args.includes("--all-tenants");
  const catalogOnly = args.includes("--catalog-only");
  const yearId = args.find((a) => a.startsWith("--year="))?.split("=")[1]?.trim();
  const levelArg = args.find((a) => a.startsWith("--level="))?.split("=")[1]?.trim();
  const level = levelArg === "A_LEVEL" ? "A_LEVEL" : "O_LEVEL";

  const tenantIds = allTenants
    ? (await pool.query<{ id: string }>(`SELECT id FROM tenants ORDER BY slug`)).rows.map((r) => r.id)
    : [await getDefaultTenantId()];

  for (const tenantId of tenantIds) {
    await tenantContext.run(tenantId, async () => {
      if (catalogOnly) {
        const catalog = await seedCurriculumCatalog({ level: "ALL", includeStrands: true });
        console.log(`[tenant ${tenantId}] catalogue:`, catalog);
        return;
      }

      if (!yearId) {
        throw new Error("--year=<academicYearId> is required unless --catalog-only is set");
      }

      const statusBefore = await getCurriculumStatus(yearId);
      console.log(`[tenant ${tenantId}] status before:`, statusBefore);

      const result = await provisionCurriculum({
        academicYearId: yearId,
        level,
        installCatalog: true,
      });
      console.log(`[tenant ${tenantId}] provisioned (${level}):`, result);

      const statusAfter = await getCurriculumStatus(yearId);
      console.log(`[tenant ${tenantId}] status after:`, statusAfter);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
