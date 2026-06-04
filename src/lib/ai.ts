import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export async function generateWordContent(word: string, level: string) {
  const prompt = `你是一位英语四六级备考专家。请为以下单词生成学习内容，用 JSON 返回：

{
  "word": "${word}",
  "pronunciation": "<音标>",
  "meaning": "<中文释义>",
  "mnemonic": "<巧记法，优先使用：1)词根词缀 2)谐音联想 3)拆分联想。要生动有趣、易于记忆。50字以内>",
  "example_sentence": "<包含该单词的英文例句，难度适合${level}水平，贴近大学生活>",
  "example_translation": "<例句中文翻译>",
  "tags": ["<2-3个标签，如高频词、动词、校园等>"]
}

要求：${level}词汇难度、巧记法准确不牵强、例句贴近大学生活场景`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("AI returned empty response");
  return JSON.parse(content);
}

export async function generatePassageContent(
  targetWords: string[],
  level: string,
  topic: string
) {
  const wordList = targetWords.join(", ");
  const prompt = `你是一位英语四六级备考专家。请用以下词汇写一篇50-80词的英语短文，主题为"${topic}"。

目标词汇（必须在文中出现）：${wordList}

返回 JSON：
{
  "title": "<短文标题>",
  "content": "<短文正文，50-80词，自然流畅，贴近大学生活>",
  "translation": "<中文翻译>",
  "highlighted_word_ids": [],
  "tags": ["<2-3个主题标签>"]
}

要求：短文自然流畅、目标词汇在文中高亮标注位置（用 [] 括起来）、${level}难度`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("AI returned empty response");
  return JSON.parse(content);
}