import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildCatalog } from "../src/data/catalog";
import { upcoming } from "../src/data/upcoming";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const catalog = buildCatalog();
  let priceChanges = 0;
  for (const record of catalog) {
    const data = { ...record, category: record.category === "laptop" ? "LAPTOP" : "PHONE" } as const;
    const device = await prisma.device.upsert({ where: { slug: record.slug }, create: data, update: data });
    // Price history: record a point whenever the seeded price differs from the last one.
    const last = await prisma.pricePoint.findFirst({ where: { deviceId: device.id }, orderBy: { recordedAt: "desc" } });
    if (!last || last.price !== record.price) {
      await prisma.pricePoint.create({
        data: { deviceId: device.id, price: record.price, source: record.priceSource, recordedAt: record.priceCheckedOn },
      });
      if (last) priceChanges += 1;
    }
  }

  for (const item of upcoming) {
    const data = { ...item, category: item.category === "laptop" ? "LAPTOP" : "PHONE" } as const;
    await prisma.upcomingDevice.upsert({ where: { slug: item.slug }, create: data, update: data });
  }
  // Drop devices that were removed from the seed files.
  const { count: removed } = await prisma.device.deleteMany({
    where: { slug: { notIn: catalog.map((r) => r.slug) } },
  });
  const laptops = catalog.filter((r) => r.category === "laptop").length;
  console.log(
    `Seeded ${laptops} laptops and ${catalog.length - laptops} phones${removed ? `, removed ${removed} no longer listed` : ""}, ${priceChanges} price changes, ${upcoming.length} upcoming.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
