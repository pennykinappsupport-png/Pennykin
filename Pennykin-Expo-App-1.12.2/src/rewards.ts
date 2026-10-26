export type DailyReward = {
  day: number;
  coins: number;
  treats: number;
  special: boolean;
};

const coinRewards = [3, 4, 5, 0, 6, 8, 15, 5, 6, 0, 7, 8, 10, 20, 7, 8, 9, 0, 10, 12, 25, 10, 11, 12, 0, 13, 14, 15, 18, 40];
const treatDays = new Map<number, number>([[4, 1], [10, 1], [14, 1], [18, 1], [21, 1], [25, 1], [30, 2]]);

export const DAILY_REWARDS: DailyReward[] = coinRewards.map((coins, index) => ({
  day: index + 1,
  coins,
  treats: treatDays.get(index + 1) ?? 0,
  special: [7, 14, 21, 30].includes(index + 1),
}));

export function rewardForStreak(streak: number): DailyReward {
  const day = ((Math.max(1, streak) - 1) % 30) + 1;
  return DAILY_REWARDS[day - 1]!;
}

export function rewardLabel(reward: DailyReward): string {
  const parts: string[] = [];
  if (reward.coins) parts.push(`${reward.coins} coins`);
  if (reward.treats) parts.push(`${reward.treats} premium treat${reward.treats > 1 ? "s" : ""}`);
  return parts.join(" + ");
}
