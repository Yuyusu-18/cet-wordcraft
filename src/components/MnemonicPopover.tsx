"use client";

import { useState } from "react";

interface MnemonicPopoverProps {
  word: string;
  pronunciation: string;
  meaning: string;
  mnemonic: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export default function MnemonicPopover({
  word,
  pronunciation,
  meaning,
  mnemonic,
  exampleSentence,
  exampleTranslation,
}: MnemonicPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline">
      <span
        className="border-b-2 border-dashed border-warm-400 text-warm-700 cursor-pointer hover:bg-warm-100 px-0.5 rounded"
        onClick={() => setOpen(!open)}
      >
        {word}
      </span>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-warm-200 p-4 animate-in fade-in">
            <div className="text-lg font-bold text-gray-800 mb-1">
              {word}
              <span className="text-sm font-normal text-gray-400 ml-2">
                {pronunciation}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">{meaning}</div>
            <div className="bg-warm-50 rounded-lg p-3 text-sm text-gray-700 mb-2">
              💡 <span className="font-medium">巧记：</span>{mnemonic}
            </div>
            <div className="text-xs text-gray-500">
              📝 {exampleSentence}
              <br />
              {exampleTranslation}
            </div>
          </div>
        </>
      )}
    </span>
  );
}