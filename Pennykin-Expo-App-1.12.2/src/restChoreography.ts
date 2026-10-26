export type RestStage = "Rest_Enter" | "Rest_Loop" | "Rest_Exit";
export const REST_ENTER_MS = 1000;
export const REST_LOOP_MS = 30000;
export const REST_EXIT_MS = 1000;
export const REST_ZZZ_FADE_MS = 200;
export const REST_DOUBLE_TAP_MS = 300;
export const REST_DURATION_MS = REST_ENTER_MS + REST_LOOP_MS + REST_EXIT_MS;

export const REST_MESSAGES: Record<RestStage, string> = {
  Rest_Enter: "So sleepy… just a little yawn.",
  Rest_Loop: "Zzz… Tap gently, or double-tap to wake me.",
  Rest_Exit: "Mrrp… a big stretch! I feel refreshed.",
};

// These are animation-control outputs from the existing single FSM, rather
// than a second independent controller that can leave sleeping layers behind.
export function restControls(stage: RestStage | null) {
  return {
    isResting: stage === "Rest_Enter" || stage === "Rest_Loop",
    triggerYawn: stage === "Rest_Enter",
    triggerWakeUp: stage === "Rest_Exit",
  };
}

export function restTransitionLocked(stage: RestStage | null): boolean {
  return stage === "Rest_Enter" || stage === "Rest_Exit";
}

export type RestWakeReason = "doubleTap" | "screenTap" | "timeout" | "action";

export const DOG_REST_MESSAGES: Record<RestStage,string> = {...REST_MESSAGES,Rest_Loop:"Zzz… Tap anywhere to wake me."};

export const NATIVE_REST_MESSAGES=DOG_REST_MESSAGES;
