import { calculateNextReview, getSessionSize } from "../spaced-repetition";

describe("calculateNextReview", () => {
  it("increases mastery on correct answer", () => {
    const result = calculateNextReview(2, true);
    expect(result.mastery).toBe(3);
  });

  it("caps mastery at 5", () => {
    const result = calculateNextReview(5, true);
    expect(result.mastery).toBe(5);
  });

  it("resets mastery to 1 on incorrect answer", () => {
    const result = calculateNextReview(4, false);
    expect(result.mastery).toBe(1);
  });

  it("sets next review date correctly", () => {
    const result = calculateNextReview(3, true);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 14); // mastery 4 = 14 days
    expect(result.nextReviewAt.toDateString()).toBe(expectedDate.toDateString());
  });
});

describe("getSessionSize", () => {
  it("returns 20 when pool is large", () => {
    expect(getSessionSize(100)).toBe(20);
  });

  it("returns 15 when pool is moderate", () => {
    expect(getSessionSize(15)).toBe(15);
  });

  it("returns actual count when pool is small", () => {
    expect(getSessionSize(3)).toBe(3);
  });
});