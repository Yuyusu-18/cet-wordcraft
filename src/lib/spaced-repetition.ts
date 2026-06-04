// Simplified SM-2 algorithm
// mastery levels: 0 (new) → 1 → 2 → 3 → 4 → 5 (mastered)

const INTERVALS: Record<number, number> = {
  1: 1,   // 1 day
  2: 3,   // 3 days
  3: 7,   // 7 days
  4: 14,  // 14 days
  5: 30,  // 30 days
};

export function calculateNextReview(
  currentMastery: number,
  isCorrect: boolean
): { mastery: number; nextReviewAt: Date } {
  let newMastery: number;

  if (isCorrect) {
    newMastery = Math.min(currentMastery + 1, 5);
  } else {
    newMastery = 1; // Reset on failure
  }

  const days = INTERVALS[newMastery] ?? 1;
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + days);

  return { mastery: newMastery, nextReviewAt };
}

export function getSessionSize(totalAvailable: number): number {
  if (totalAvailable >= 20) return 20;
  if (totalAvailable >= 10) return 15;
  return Math.max(totalAvailable, 1);
}