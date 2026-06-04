"use client";

import MnemonicPopover from "@/components/MnemonicPopover";

interface HighlightedWord {
  id: number;
  word: string;
  pronunciation: string;
  meaning: string;
  mnemonic: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export default function PassageReader({
  content,
  highlightedWords,
}: {
  content: string;
  highlightedWords: HighlightedWord[];
}) {
  const wordMap = new Map(highlightedWords.map((w) => [w.word.toLowerCase(), w]));

  const parts = content.split(/\b/);

  return (
    <div className="text-lg leading-relaxed text-gray-700">
      {parts.map((part, i) => {
        const match = wordMap.get(part.toLowerCase());
        if (match) {
          return (
            <MnemonicPopover
              key={i}
              word={part}
              pronunciation={match.pronunciation}
              meaning={match.meaning}
              mnemonic={match.mnemonic}
              exampleSentence={match.exampleSentence}
              exampleTranslation={match.exampleTranslation}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}