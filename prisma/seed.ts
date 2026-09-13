import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildCatalog } from "../src/data/catalog";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const catalog = buildCatalog();
  for (const record of catalog) {
    const data = { ...record, category: record.category === "laptop" ? "LAPTOP" : "PHONE" } as const;
    await prisma.device.upsert({ where: { slug: record.slug }, create: data, update: data });
  }
  // Drop devices that were removed from the seed files.
  const { count: removed } = await prisma.device.deleteMany({
    where: { slug: { notIn: catalog.map((r) => r.slug) } },
  });
  const laptops = catalog.filter((r) => r.category === "laptop").length;
  console.log(
    `Seeded ${laptops} laptops and ${catalog.length - laptops} phones${removed ? `, removed ${removed} no longer listed` : ""}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
