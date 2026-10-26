import type { PetVisualState } from "./types";
import { REST_DOUBLE_TAP_MS, REST_ENTER_MS, REST_EXIT_MS, REST_LOOP_MS, type RestStage, type RestWakeReason } from "./restChoreography";

export type PetAnimationPhase = "idle" | "starting" | "playing" | "finishing" | "paused";
export type ActivePetAnimationPhase = Exclude<PetAnimationPhase, "idle" | "paused">;
export type PetAnimationPriority = "tap" | "interaction" | "important";

export interface PetAnimationRequest {
  id: string;
  state: PetVisualState;
  message: string;
  durationMs: number;
  priority: PetAnimationPriority;
  manual?: boolean;
  rest?: boolean;
  restNative?: boolean;
}

export interface PetAnimationMachineState {
  phase: PetAnimationPhase;
  active: PetAnimationRequest | null;
  queue: PetAnimationRequest[];
  resumePhase: ActivePetAnimationPhase | null;
  restTapAt: number | null;
  restFeedback: number;
  restWakeReason: RestWakeReason | null;
}

export type PetAnimationMachineEvent =
  | { type: "REQUEST"; request: PetAnimationRequest; startPaused?: boolean }
  | { type: "ADVANCE" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "UPDATE_MESSAGE"; id: string; message: string }
  | { type: "CANCEL_ACTIVE" }
  | { type: "CANCEL_ID"; id: string }
  | { type: "CLEAR" };
// Interactive visits keep the playing phase open until their own steps finish.
export type ManualPetAnimationEvent =
  | { type: "REST_NATIVE_FINISHED"; id: string; stage: RestStage }
  | { type: "FINISH_MANUAL"; id: string }
  | { type: "REST_TAP"; id: string; at: number }
  | { type: "REST_SINGLE_TIMEOUT"; id: string; at: number }
  | { type: "WAKE_REST"; id: string; reason: RestWakeReason };

export const initialPetAnimationState: PetAnimationMachineState = {
  phase: "idle",
  active: null,
  queue: [],
  resumePhase: null,
  restTapAt: null,
  restFeedback: 0,
  restWakeReason: null,
};

export function restStageFor(state: PetAnimationMachineState): RestStage | null {
  if (!state.active?.rest) return null;
  const phase = state.phase === "paused" ? state.resumePhase : state.phase;
  return phase === "starting" ? "Rest_Enter" : phase === "playing" ? "Rest_Loop" : phase === "finishing" ? "Rest_Exit" : null;
}

function wakeRest(state: PetAnimationMachineState, reason: RestWakeReason): PetAnimationMachineState {
  return { ...state, phase: "finishing", restTapAt: null, restWakeReason: reason };
}

function startRequest(
  state: PetAnimationMachineState,
  request: PetAnimationRequest,
  paused: boolean,
): PetAnimationMachineState {
  return {
    ...state,
    active: request,
    phase: paused ? "paused" : "starting",
    resumePhase: paused ? "starting" : null,
    restTapAt: null,
    restFeedback: 0,
    restWakeReason: null,
  };
}

function startNext(state: PetAnimationMachineState, stayPaused: boolean): PetAnimationMachineState {
  const [next, ...rest] = state.queue;
  if (!next) return initialPetAnimationState;
  return startRequest({ ...state, queue: rest }, next, stayPaused);
}

export function petAnimationReducer(
  state: PetAnimationMachineState,
  event: PetAnimationMachineEvent | ManualPetAnimationEvent,
): PetAnimationMachineState {
  switch (event.type) {
    case "REST_NATIVE_FINISHED": {
      if(!state.active?.restNative || state.active.id!==event.id || event.stage==="Rest_Loop" || restStageFor(state)!==event.stage)return state;
      if(event.stage==="Rest_Enter")return state.phase==="paused" ? {...state,resumePhase:"playing"} : {...state,phase:"playing"};
      return startNext(state,state.phase==="paused");
    }
    case "REST_TAP": {
      if (!state.active?.rest || state.active.id !== event.id || state.phase !== "playing") return state;
      const gap = state.restTapAt === null ? Infinity : event.at - state.restTapAt;
      if (gap >= 0 && gap <= REST_DOUBLE_TAP_MS) return wakeRest(state, "doubleTap");
      // If a delayed JS timer has not resolved the previous touch yet, do so
      // here before starting a new window. Never lose a lone touch at 301ms.
      return { ...state, restTapAt: event.at, restFeedback: state.restFeedback + (state.restTapAt === null ? 0 : 1) };
    }
    case "REST_SINGLE_TIMEOUT":
      if (!state.active?.rest || state.active.id !== event.id || state.phase !== "playing" || state.restTapAt !== event.at) return state;
      return { ...state, restTapAt: null, restFeedback: state.restFeedback + 1 };
    case "WAKE_REST":
      if (!state.active?.rest || state.active.id !== event.id || state.phase !== "playing") return state;
      return wakeRest(state, event.reason);
    case "FINISH_MANUAL":
      if (state.active?.id !== event.id || !state.active.manual) return state;
      if (state.phase === "paused" && state.resumePhase === "playing") return { ...state, resumePhase: "finishing" };
      return state.phase === "playing" ? { ...state, phase: "finishing" } : state;
    case "REQUEST": {
      const duplicate = state.active?.id === event.request.id || state.queue.some((item) => item.id === event.request.id);
      if (duplicate) return state;
      if (!state.active || state.phase === "idle") {
        return startRequest(state, event.request, event.startPaused === true);
      }
      const stayPaused = state.phase === "paused" || event.startPaused === true;
      if (state.active.rest) {
        // Rest touch gestures are handled separately; no queued hello/jump.
        if (event.request.priority === "tap") return state;
        if (event.request.priority === "interaction") {
          if (state.phase !== "playing" || event.request.rest || stayPaused) return state;
          return { ...wakeRest(state, "action"), queue: [event.request, ...state.queue] };
        }
      }
      if (event.request.priority === "tap") {
        if (state.active.priority === "tap") return startRequest(state, event.request, stayPaused);
        // A care/reward animation keeps playing. Retain only the latest hello,
        // so rapid touches get a response without building a long backlog.
        return { ...state, queue: [...state.queue.filter((item) => item.priority !== "tap"), event.request] };
      }
      if (state.active.priority === "tap") {
        // Care and rewards can start immediately after a hello.
        return startRequest({ ...state, queue: state.queue.filter((item) => item.priority !== "tap") }, event.request, stayPaused);
      }
      if (event.request.priority !== "important") return state;
      return { ...state, queue: [...state.queue.filter((item) => item.priority !== "tap"), event.request, ...state.queue.filter((item) => item.priority === "tap")] };
    }
    case "ADVANCE":
      if (!state.active || state.phase === "idle" || state.phase === "paused") return state;
      if(state.active.restNative && (state.phase==="starting" || state.phase==="finishing"))return state;
      if (state.phase === "starting") return { ...state, phase: "playing" };
      if (state.phase === "playing") return state.active.rest ? wakeRest(state, "timeout") : { ...state, phase: "finishing" };
      return startNext(state, false);
    case "PAUSE":
      if (!state.active || state.phase === "idle" || state.phase === "paused") return state;
      return { ...state, phase: "paused", resumePhase: state.phase, restTapAt: null };
    case "RESUME":
      if (!state.active || state.phase !== "paused") return state;
      return { ...state, phase: state.resumePhase ?? "starting", resumePhase: null };
    case "UPDATE_MESSAGE":
      if (state.active?.id === event.id) return { ...state, active: { ...state.active, message: event.message } };
      if (!state.queue.some((item) => item.id === event.id)) return state;
      return { ...state, queue: state.queue.map((item) => item.id === event.id ? { ...item, message: event.message } : item) };
    case "CANCEL_ACTIVE":
      if (!state.active) return state;
      return startNext(state, state.phase === "paused");
    case "CANCEL_ID":
      if (state.active?.id === event.id) return startNext(state, state.phase === "paused");
      return { ...state, queue: state.queue.filter((item) => item.id !== event.id) };
    case "CLEAR":
      return initialPetAnimationState;
  }
}

export function phaseDurationMs(state: PetAnimationMachineState): number | null {
  if (!state.active) return null;
  if (state.active.rest) {
    if(state.active.restNative && (state.phase==="starting" || state.phase==="finishing"))return null;
    if (state.phase === "starting") return REST_ENTER_MS;
    if (state.phase === "playing") return REST_LOOP_MS;
    if (state.phase === "finishing") return REST_EXIT_MS;
    return null;
  }
  if (state.phase === "starting") return 140;
  if (state.phase === "finishing") return 220;
  if (state.phase === "playing") return state.active.manual ? null : Math.max(240, state.active.durationMs - 360);
  return null;
}
