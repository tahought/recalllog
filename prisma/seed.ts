import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * シーディング処理。
 * ★ パスワードは必ず bcrypt でハッシュ化してから保存する（平文保存は厳禁）。
 */
const COST_FACTOR = 10;

const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
};

const seedUsers = [
  {
    email: "admin@example.com",
    name: "システム管理者",
    rawPassword: "Admin#Passw0rd",
    role: Role.ADMIN,
  },
  {
    email: "user01@example.com",
    name: "学習太郎",
    rawPassword: "User01#Passw0rd",
    role: Role.USER,
  },
  {
    email: "user02@example.com",
    name: "復習花子",
    rawPassword: "User02#Passw0rd",
    role: Role.USER,
  },
];

// user01 用のサンプル学習ログ（復習日をばらけさせる）
const now = new Date();
const sampleLogs = [
  { title: "英語：仮定法過去完了", content: "If I had known ... would have ...", tag: "英語", stage: 1, dueOffset: 0 },   // 今日が期限
  { title: "React：useEffectの依存配列", content: "依存配列が空なら初回のみ実行", tag: "プログラミング", stage: 0, dueOffset: 0 }, // 今日
  { title: "世界史：フランス革命の流れ", content: "三部会→バスティーユ→人権宣言", tag: "歴史", stage: 2, dueOffset: 1 },  // 明日
  { title: "数学：部分積分の公式", content: "∫u dv = uv - ∫v du", tag: "数学", stage: 1, dueOffset: 3 },
  { title: "英単語：ubiquitous", content: "遍在する、どこにでもある", tag: "英語", stage: 0, dueOffset: -1 }, // 延滞
  { title: "情報：TCPの3ウェイハンドシェイク", content: "SYN → SYN/ACK → ACK", tag: "情報", stage: 3, dueOffset: 7 },
];

async function main() {
  console.log("Seeding start...");

  await prisma.review.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.studyLog.deleteMany();
  await prisma.user.deleteMany();

  for (const u of seedUsers) {
    const hashed = await bcrypt.hash(u.rawPassword, COST_FACTOR);
    const user = await prisma.user.create({
      data: { email: u.email, name: u.name, password: hashed, role: u.role },
    });
    console.log(`  created: ${user.email} (${user.role})`);

    if (u.email === "user01@example.com") {
      for (const s of sampleLogs) {
        await prisma.studyLog.create({
          data: {
            title: s.title,
            content: s.content,
            tag: s.tag,
            userId: user.id,
            stage: s.stage,
            reviewCount: s.stage,
            learnedAt: addDays(now, -(s.stage * 3 + 1)),
            nextReviewAt: addDays(now, s.dueOffset),
          },
        });
      }
      console.log(`    + ${sampleLogs.length} study logs`);
    }
  }

  console.log("Seeding done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
