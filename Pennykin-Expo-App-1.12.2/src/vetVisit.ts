export type VetStage = "checking" | "treat" | "treating" | "soothe" | "happy";
export type VetVisit = { id: string; stage: VetStage; applied: boolean };
export const VET_CHECK_MS = 1000;
export const VET_TREAT_MS = 850;
export const VET_HAPPY_MS = 1200;

export type VetEvent =
  | { type: "START"; id: string }
  | { type: "CLEAR" }
  | { type: "CHECKED" | "TREAT" | "APPLIED" | "TREAT_FINISHED" | "FAILED" | "SOOTHE"; id: string };

export function vetVisitReducer(visit: VetVisit | null, event: VetEvent): VetVisit | null {
  if (event.type === "START") return visit?.id === event.id ? visit : { id: event.id, stage: "checking", applied: false };
  if (event.type === "CLEAR") return null;
  if (!visit || visit.id !== event.id) return visit;
  if (event.type === "CHECKED" && visit.stage === "checking") return { ...visit, stage: "treat" };
  if (event.type === "TREAT" && visit.stage === "treat" && !visit.applied) return { ...visit, stage: "treating" };
  if (event.type === "APPLIED" && visit.stage === "treating" && !visit.applied) return { ...visit, applied: true };
  if (event.type === "TREAT_FINISHED" && visit.stage === "treating" && visit.applied) return { ...visit, stage: "soothe" };
  if (event.type === "FAILED" && visit.stage === "treating" && !visit.applied) return { ...visit, stage: "treat" };
  if (event.type === "SOOTHE" && visit.stage === "soothe" && visit.applied) return { ...visit, stage: "happy" };
  return visit;
}

export function vetStageDelay(visit: VetVisit | null): number | null {
  if (visit?.stage === "checking") return VET_CHECK_MS;
  if (visit?.stage === "treating" && visit.applied) return VET_TREAT_MS;
  return visit?.stage === "happy" ? VET_HAPPY_MS : null;
}

export function vetMessage(stage: VetStage): string {
  return {
    checking: "A little nervous… stay close while we listen to my heartbeat.",
    treat: "All checked. A little comfort patch will help.",
    treating: "One gentle patch… thank you for looking after me.",
    soothe: "Could you pet me? Tap me for a little reassurance.",
    happy: "That feels better. I feel safe with you!",
  }[stage];
}
