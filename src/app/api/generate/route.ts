import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateWordContent, generatePassageContent } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { contentType, level, words, topic } = body as {
      contentType: string;
      level: string;
      words?: string[];
      topic?: string;
    };

    if (!contentType || !level) {
      return NextResponse.json(
        { error: "请提供 contentType 和 level" },
        { status: 400 }
      );
    }

    if (!["word", "phrase", "passage"].includes(contentType)) {
      return NextResponse.json(
        { error: "contentType 必须是 word、phrase 或 passage" },
        { status: 400 }
      );
    }

    if (!["CET4", "CET6"].includes(level)) {
      return NextResponse.json(
        { error: "level 必须是 CET4 或 CET6" },
        { status: 400 }
      );
    }

    const results: Record<string, unknown>[] = [];

    if (contentType === "word" || contentType === "phrase") {
      if (!words || words.length === 0) {
        return NextResponse.json(
          { error: "请提供至少一个单词或短语" },
          { status: 400 }
        );
      }

      for (const word of words) {
        const generated = await generateWordContent(word, level);

        const data = {
          ...(contentType === "word"
            ? { word: generated.word || word }
            : { phrase: generated.word || word }),
          pronunciation: generated.pronunciation || "",
          meaning: generated.meaning || "",
          mnemonic: generated.mnemonic || "",
          exampleSentence: generated.example_sentence || "",
          exampleTranslation: generated.example_translation || "",
          level,
          tags: JSON.stringify(
            Array.isArray(generated.tags) ? generated.tags : []
          ),
          status: "draft",
        };

        let saved;
        if (contentType === "word") {
          saved = await prisma.word.create({ data: data as Parameters<typeof prisma.word.create>[0]["data"] });
        } else {
          saved = await prisma.phrase.create({ data: data as Parameters<typeof prisma.phrase.create>[0]["data"] });
        }

        if (contentType === "word") {
          const w = saved as { id: number; word: string; pronunciation: string; meaning: string; mnemonic: string; exampleSentence: string; exampleTranslation: string; level: string; tags: string; status: string };
          results.push({
            id: w.id,
            word: w.word,
            pronunciation: w.pronunciation,
            meaning: w.meaning,
            mnemonic: w.mnemonic,
            exampleSentence: w.exampleSentence,
            exampleTranslation: w.exampleTranslation,
            level: w.level,
            tags: w.tags,
            status: w.status,
          });
        } else {
          const p = saved as { id: number; phrase: string; meaning: string; mnemonic: string; exampleSentence: string; exampleTranslation: string; level: string; tags: string; status: string };
          results.push({
            id: p.id,
            phrase: p.phrase,
            meaning: p.meaning,
            mnemonic: p.mnemonic,
            exampleSentence: p.exampleSentence,
            exampleTranslation: p.exampleTranslation,
            level: p.level,
            tags: p.tags,
            status: p.status,
          });
        }
      }
    } else if (contentType === "passage") {
      const generated = await generatePassageContent(
        words || [],
        level,
        topic || "校园生活"
      );

      const saved = await prisma.passage.create({
        data: {
          title: generated.title || topic || "未命名短文",
          content: generated.content || "",
          translation: generated.translation || "",
          highlightedWordIds: JSON.stringify(
            Array.isArray(generated.highlighted_word_ids)
              ? generated.highlighted_word_ids
              : []
          ),
          level,
          tags: JSON.stringify(
            Array.isArray(generated.tags) ? generated.tags : []
          ),
          status: "draft",
        },
      });

      results.push({
        id: saved.id,
        title: saved.title,
        content: saved.content,
        translation: saved.translation,
        level: saved.level,
        tags: saved.tags,
        status: saved.status,
      });
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "生成失败，请重试" },
      { status: 500 }
    );
  }
}