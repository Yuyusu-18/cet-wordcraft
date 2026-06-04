#!/bin/bash
set -e

echo "🔧 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database (if empty)..."
# Only seed if the words table is empty
WORD_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), dbPath) });
const prisma = new PrismaClient({ adapter });
prisma.word.count().then(c => { console.log(c); prisma.\$disconnect(); });
")
if [ "$WORD_COUNT" = "0" ]; then
  echo "🌱 Database is empty, seeding..."
  npx tsx prisma/seed.ts
else
  echo "✅ Database has $WORD_COUNT words, skipping seed"
fi

echo "🚀 Starting Next.js..."
exec node node_modules/.bin/next start