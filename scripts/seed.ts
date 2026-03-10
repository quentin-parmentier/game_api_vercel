import { frenchWords } from "../data/french-words";
import { seedDatabase } from "../lib/db";

async function main() {
  console.log("Seeding database...");
  await seedDatabase(frenchWords);
  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
