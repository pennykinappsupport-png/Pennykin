import { getBudgetMetrics } from "./budget";
import { todayKey } from "./date";
import type { PetVisualState, Snapshot } from "./types";

export type PetMoment = {
  message: string;
  state: PetVisualState;
};

const TIME_MESSAGES = {
  morning: [
    "Morning! The room feels extra soft before the day gets noisy.",
    "I saved you the sunny patch. We can start whenever you’re ready.",
    "New day, clean page. Tiny steps are plenty.",
  ],
  afternoon: [
    "A little afternoon visit! I was hoping you’d stop by.",
    "Should we stretch, check in, or simply sit together for a minute?",
    "The light moved across the floor while I waited for you.",
  ],
  evening: [
    "You made it through today. I’m proud of the noticing, not perfection.",
    "Evening is good for soft lights and honest little check-ins.",
    "We can put today down gently and try again tomorrow.",
  ],
};

const PET_MESSAGES = {
  cat: [
    "I inspected the windowsill. Everything is officially cozy.",
    "A head scratch is accepted as excellent financial planning support.",
    "I may look dignified, but I would absolutely chase a receipt string.",
  ],
  dog: [
    "I heard you coming! My tail knew before I did.",
    "Want company? I can bring enthusiasm and exactly zero judgment.",
    "I guarded our little plan. No suspicious squirrels got near it.",
  ],
  rabbit: [
    "I found a quiet corner where small goals grow well.",
    "My ears are listening. You never have to make today sound perfect.",
    "One hop, one check-in, one tiny home built over time.",
  ],
};

function choose<T>(items: T[], tapCount: number, seed: number): T {
  return items[Math.abs(tapCount + seed) % items.length]!;
}

export function getPetTapMoment(snapshot: Snapshot, tapCount: number): PetMoment {
  const { pet, settings, financialActuals, pendingGifts, savingsGoal } = snapshot;
  const today = todayKey();
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const todayEntries = financialActuals.todayCount;
  const metrics = getBudgetMetrics(snapshot);
  const budgetRatio = metrics.totalSpentCents / settings.weeklyBudgetCents;
  const categoryAboveWhileOnTrack = metrics.remainingBudgetCents >= 0 && metrics.categoryRows.some((row) => row.plannedCents > 0 && row.varianceCents > 0);
  const lowSafeAmount = metrics.safeTodayCents <= metrics.baselineDailyCents * 0.4;
  const goalRatio = savingsGoal ? savingsGoal.savedCents / savingsGoal.targetCents : 0;
  const daySeed = Number(today.replaceAll("-", "")) % 17;
  const pool = [...TIME_MESSAGES[period], ...PET_MESSAGES[settings.petType]];
  let state: PetMoment["state"] = tapCount % 4 === 0 ? "curious" : "calm";

  if (pet.sleepingSince) {
    pool.push(
      pet.wakeProgress === 0 ? "I’m having a deep nap. Two honest check-ins will help me wake gently." : "I heard that check-in in my dream. Just one more and I’ll be awake!",
      "No need to rush me awake. Your honest records are the softest alarm clock.",
    );
    state = pet.wakeProgress > 0 ? "waking" : "sleeping";
  } else if (pendingGifts.length > 0) {
    pool.push(
      "The box is making mysterious little noises. Should we open it?",
      "I carried that gift all the way home—my paws are still excited.",
      "I promise I did not peek inside. Well… not very much.",
    );
    state = "celebrate";
  } else if (settings.noSpendDate === today) {
    pool.push(
      "A no-spend day is information, not a test. I put it safely in our story.",
      "The savings jar made a tiny happy clink today.",
      "We noticed today together. That is the reward.",
    );
    state = "celebrate";
  } else if (goalRatio >= 1) {
    pool.push(
      "Our goal is complete! I’m still finding confetti in my fur.",
      "We built that dream one update at a time. Look at it now!",
      "Achievement unlocked: a very proud pet and a finished savings goal.",
    );
    state = "celebrate";
  } else if (goalRatio >= 0.5) {
    pool.push(
      "The savings jar is past halfway. I like the sound of steady progress.",
      "More than halfway is exciting—but there is no need to rush.",
    );
    state = "curious";
  } else if (metrics.forecastReady && metrics.forecastCents > settings.weeklyBudgetCents) {
    pool.push(
      `My little calculator estimates ${Math.max(1, metrics.paceRatio).toFixed(1)}× our baseline pace. It’s only an estimate, and we can still adjust.`,
      "I checked the numbers gently. The current pace may finish above the plan, but today still has choices.",
    );
    state = "worried";
  } else if (categoryAboveWhileOnTrack) {
    pool.push(
      "One category moved above its plan, while the total is still on track. We can rearrange from another category.",
      "The little calendar says our overall plan still has room, even though one category changed.",
    );
    state = "curious";
  } else if (lowSafeAmount) {
    pool.push(
      "Today’s flexible amount is smaller, so I’m keeping our transport and meal money in view.",
      "A low Safe to Spend number is information, not a punishment. Let’s protect the costs we already know about.",
    );
    state = "saving";
  } else if (budgetRatio >= 0.9) {
    pool.push(
      "The weekly plan is getting full. We can stay curious without feeling guilty.",
      "A number is a signal, never a scolding. I’m right here.",
      "Let’s notice the budget together. No sad faces, no punishment.",
    );
    state = "worried";
  } else if (todayEntries > 0 || settings.lastCheckinDate === today) {
    pool.push(
      "Today is already recorded. Now we can enjoy the room we’re building.",
      "Honest check-in complete! Would you like a tiny victory wiggle?",
      "You showed up today. That matters more than the amount you entered.",
      "Our little record is safe. Thanks for telling the truth about today.",
    );
    state = tapCount % 3 === 0 ? "celebrate" : "calm";
  } else {
    pool.push(
      "Whenever you’re ready, tell me what money looked like today.",
      "No perfect numbers needed. I only care that we notice together.",
      "We can log something, mark a no-spend day, or just say hello first.",
      "The check-in can be tiny. Tiny things still build a home.",
    );
    state = "curious";
  }

  return { message: choose(pool, tapCount, daySeed), state };
}

export function getPetMoment(snapshot: Snapshot): PetMoment {
  const { pet, settings, financialActuals, pendingGifts, savingsGoal } = snapshot;
  const today = todayKey();
  const todayEntries = financialActuals.todayCount;
  const metrics = getBudgetMetrics(snapshot);
  const budgetRatio = metrics.totalSpentCents / settings.weeklyBudgetCents;
  const categoryAboveWhileOnTrack = metrics.remainingBudgetCents >= 0 && metrics.categoryRows.some((row) => row.plannedCents > 0 && row.varianceCents > 0);
  const lowSafeAmount = metrics.safeTodayCents <= metrics.baselineDailyCents * 0.4;
  const goalRatio = savingsGoal ? savingsGoal.savedCents / savingsGoal.targetCents : 0;

  if (pet.sleepingSince) {
    const remaining = Math.max(1, 2 - pet.wakeProgress);
    return {
      message: pet.wakeProgress > 0 ? "I heard your first check-in. One more will gently wake me." : `I’m taking a long nap. ${remaining} honest check-ins will help me wake up.`,
      state: pet.wakeProgress > 0 ? "waking" : "sleeping",
    };
  }
  if (pendingGifts.length > 0) {
    return { message: "I brought something home! Want to open it together?", state: "curious" };
  }
  if (goalRatio >= 1) {
    return { message: "Goal complete! I saved a spot for our tiny celebration.", state: "calm" };
  }
  if (settings.noSpendDate === today) {
    return { message: "Clink! I tucked a coin into our savings jar for today’s honest check-in.", state: "calm" };
  }
  if (metrics.forecastReady && metrics.forecastCents > settings.weeklyBudgetCents) {
    return { message: `I checked our pace with my calculator. ${metrics.paceRatio.toFixed(1)}× the baseline may finish above plan, but it is only an estimate.`, state: "worried" };
  }
  if (categoryAboveWhileOnTrack) {
    return { message: "One category is above plan, but our total still has room. We can rearrange instead of judging the purchase.", state: "curious" };
  }
  if (lowSafeAmount) {
    return { message: "Today’s flexible amount is smaller. I’m keeping our reserved transport and meal money safe.", state: "saving" };
  }
  if (budgetRatio >= 0.9) {
    return { message: "We’re close to this week’s plan. Let’s just keep noticing—no judgment.", state: "worried" };
  }
  if (todayEntries > 0) {
    const remaining = Math.max(0, 3 - todayEntries);
    return {
      message: remaining === 0 ? "Three honest entries today—our gift is earned! A fresh trail begins after midnight." : `Today is recorded. ${remaining} more ${remaining === 1 ? "entry" : "entries"} until today’s gift.`,
      state: "calm",
    };
  }
  if (goalRatio >= 0.5) {
    return { message: "Our savings jar is halfway full. Slow progress still counts.", state: "curious" };
  }
  if (goalRatio >= 0.25) {
    return { message: "A quarter of the way there—I found a little box for the dream.", state: "curious" };
  }
  if (settings.lastCheckinDate === today) {
    return { message: "Today is checked in. We can just hang out now.", state: "calm" };
  }
  if (metrics.plannedTotalCents > 0 && metrics.remainingBudgetCents >= 0) {
    return { message: "I checked our little calendar. The week is still within the total plan.", state: "curious" };
  }
  return {
    message: "What did money look like today? I’m listening. Today’s three-entry trail starts fresh.",
    state: "curious",
  };
}
