import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { cet4Words, cet6Words, passages } from "./seed-data";

const connectionString = process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db";
const dbPath = path.resolve(process.cwd(), connectionString);
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // ==========================================
  // 1. Clean existing data (respect FK order)
  // ==========================================
  console.log("Clearing existing data...");
  await prisma.contentReview.deleteMany();
  await prisma.exerciseRecord.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.dailyCheckIn.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.passage.deleteMany();
  await prisma.phrase.deleteMany();
  await prisma.word.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ Cleared\n");

  // ==========================================
  // 2. Create admin user
  // ==========================================
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@cetwordcraft.com",
      name: "管理员",
      passwordHash,
    },
  });
  console.log(`  ✓ Admin user created: ${admin.email}\n`);

  // ==========================================
  // 3. Create CET-4 words
  // ==========================================
  console.log(`Creating ${cet4Words.length} CET-4 words...`);
  const createdCet4: { id: number; word: string }[] = [];
  for (const w of cet4Words) {
    const created = await prisma.word.create({ data: w });
    createdCet4.push({ id: created.id, word: created.word });
  }
  console.log(`  ✓ ${createdCet4.length} CET-4 words created\n`);

  // ==========================================
  // 4. Create CET-6 words
  // ==========================================
  console.log(`Creating ${cet6Words.length} CET-6 words...`);
  const createdCet6: { id: number; word: string }[] = [];
  for (const w of cet6Words) {
    const created = await prisma.word.create({ data: w });
    createdCet6.push({ id: created.id, word: created.word });
  }
  console.log(`  ✓ ${createdCet6.length} CET-6 words created\n`);

  // Build word-to-ID lookup
  const allWords = [...createdCet4, ...createdCet6];
  const wordToId = new Map<string, number>();
  for (const w of allWords) {
    wordToId.set(w.word.toLowerCase(), w.id);
  }

  // ==========================================
  // 5. Create passages with auto-matched word IDs
  // ==========================================
  console.log(`Creating ${passages.length} passages...`);
  let passageCount = 0;
  for (const p of passages) {
    // Find words from our vocabulary that appear in the passage content
    const matchedIds: number[] = [];
    const lowerContent = p.content.toLowerCase();
    const wordEntries = Array.from(wordToId.entries());
    for (let i = 0; i < wordEntries.length; i++) {
      const word = wordEntries[i][0];
      const id = wordEntries[i][1];
      // Match whole words only using word boundary regex
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(p.content)) {
        matchedIds.push(id);
      }
    }

    await prisma.passage.create({
      data: {
        ...p,
        highlightedWordIds: JSON.stringify(matchedIds),
      },
    });
    passageCount++;
  }
  console.log(`  ✓ ${passageCount} passages created\n`);

  // ==========================================
  // 6. Summary
  // ==========================================
  const wordCount = await prisma.word.count();
  const passageCount2 = await prisma.passage.count();

  console.log("=".repeat(50));
  console.log("🌱 Seed complete!");
  console.log("=".repeat(50));
  console.log(`  Admin:    admin@cetwordcraft.com / admin123`);
  console.log(`  Words:    ${wordCount} (CET-4: ${createdCet4.length}, CET-6: ${createdCet6.length})`);
  console.log(`  Passages: ${passageCount2}`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
