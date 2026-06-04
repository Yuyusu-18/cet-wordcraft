import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db";
const dbPath = path.resolve(process.cwd(), connectionString);
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@cetwordcraft.com" },
    update: {},
    create: {
      email: "admin@cetwordcraft.com",
      name: "管理员",
      passwordHash,
    },
  });

  // Seed sample CET-4 words
  const sampleWords = [
    {
      word: "abandon",
      pronunciation: "/əˈbændən/",
      meaning: "v. 放弃，抛弃",
      mnemonic: "a(一个) + band(乐队) + on(在演出) → 一个乐队在演出时抛弃了主唱，真是放弃治疗",
      exampleSentence: "The captain refused to abandon the sinking ship.",
      exampleTranslation: "船长拒绝放弃正在下沉的船。",
      level: "CET4",
      tags: '["高频词","动词"]',
      status: "published",
    },
    {
      word: "absorb",
      pronunciation: "/əbˈzɔːrb/",
      meaning: "v. 吸收；吸引",
      mnemonic: "ab(离开) + sorb(吸) → 把东西吸走 → 吸收。想象海绵吸水的过程",
      exampleSentence: "Plants absorb nutrients from the soil.",
      exampleTranslation: "植物从土壤中吸收养分。",
      level: "CET4",
      tags: '["动词","自然科学"]',
      status: "published",
    },
    {
      word: "academic",
      pronunciation: "/ˌækəˈdemɪk/",
      meaning: "adj. 学术的；学院的 n. 学者",
      mnemonic: "academy(学院) + ic(形容词后缀) → 学院的 → 学术的。联想：Academy Awards(奥斯卡)",
      exampleSentence: "She has an impressive academic record.",
      exampleTranslation: "她有令人印象深刻的学术成绩。",
      level: "CET4",
      tags: '["高频词","形容词"]',
      status: "published",
    },
    {
      word: "brilliant",
      pronunciation: "/ˈbrɪliənt/",
      meaning: "adj. 杰出的；明亮的",
      mnemonic: "brill(像 brillo 发光) + iant → 闪闪发光的 → 杰出的。想象一个闪闪发光的聪明大脑",
      exampleSentence: "He came up with a brilliant idea for the project.",
      exampleTranslation: "他为这个项目想出了一个绝妙的主意。",
      level: "CET4",
      tags: '["形容词","赞美"]',
      status: "published",
    },
    {
      word: "calculate",
      pronunciation: "/ˈkælkjuleɪt/",
      meaning: "v. 计算；估计",
      mnemonic: "calc(石头，古罗马用石头计数) + ulate → 用石头计算 → 计算",
      exampleSentence: "We need to calculate the total cost before making a decision.",
      exampleTranslation: "在做决定之前，我们需要计算总成本。",
      level: "CET4",
      tags: '["动词","数学"]',
      status: "published",
    },
  ];

  for (const word of sampleWords) {
    await prisma.word.upsert({
      where: { id: sampleWords.indexOf(word) + 1 },
      update: word,
      create: word,
    });
  }

  // Seed a sample passage
  await prisma.passage.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "A Day on Campus",
      content: "Every morning, I walk across the campus with a brilliant smile. The academic atmosphere here helps me absorb new knowledge quickly. I never abandon my study plan, even when it's hard to calculate the time needed for each subject.",
      translation: "每天早晨，我带着灿烂的笑容走过校园。这里的学术氛围帮助我快速吸收新知识。我从不放弃学习计划，即使很难计算每个科目所需的时间。",
      highlightedWordIds: "[1, 2, 3, 4, 5]",
      level: "CET4",
      tags: '["校园生活","日常"]',
      status: "published",
    },
  });

  console.log("Seed data created successfully!");
  console.log("Admin: admin@cetwordcraft.com / admin123");
  console.log("5 CET-4 words + 1 passage added");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });