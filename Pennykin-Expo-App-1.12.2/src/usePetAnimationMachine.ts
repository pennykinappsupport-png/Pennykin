import { useCallback, useEffect, useReducer, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  initialPetAnimationState,
  petAnimationReducer,
  phaseDurationMs,
  restStageFor,
  type PetAnimationMachineEvent,
  type PetAnimationPriority,
  type ManualPetAnimationEvent,
} from "./petAnimationMachine";
import type { PetVisualState } from "./types";
import { REST_DOUBLE_TAP_MS, REST_DURATION_MS, REST_MESSAGES, restControls, type RestStage, NATIVE_REST_MESSAGES, type RestWakeReason } from "./restChoreography";

type PlayInput = {
  id?: string;
  state: PetVisualState;
  message: string;
  durationMs: number;
  priority?: PetAnimationPriority;
  manual?: boolean;
  rest?: boolean;
  restNative?: boolean;
};

export function usePetAnimationMachine({
  fallbackMessage,
  fallbackState,
}: {
  fallbackMessage: string;
  fallbackState: PetVisualState;
}) {
  const [machine, dispatch] = useReducer(petAnimationReducer, initialPetAnimationState);
  const machineRef = useRef(machine);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef(0);
  const pausedRemainingRef = useRef<number | null>(null);
  const resumeDelayRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const waiters = useRef(new Set<{ id: string; exit: boolean; resolve: (value: boolean) => void }>());

  useEffect(() => {
    machineRef.current = machine;
    for (const waiter of waiters.current) {
      const active = machine.active?.id === waiter.id;
      const reached = active && machine.phase !== "paused" && (!waiter.exit || restStageFor(machine) === "Rest_Exit");
      const gone = !active && !machine.queue.some((item) => item.id === waiter.id);
      if (reached || gone) { waiters.current.delete(waiter); waiter.resolve(reached); }
    }
  }, [machine]);

  const waitFor = useCallback((id: string, exit: boolean) => {
    const current = machineRef.current;
    if (current.active?.id === id && current.phase !== "paused" && (!exit || restStageFor(current) === "Rest_Exit")) return Promise.resolve(true);
    if (current.active?.id !== id && !current.queue.some((item) => item.id === id)) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => waiters.current.add({ id, exit, resolve }));
  }, []);
  const whenActive = useCallback((id: string) => waitFor(id, false), [waitFor]);
  const whenRestExit = useCallback((id: string) => waitFor(id, true), [waitFor]);

  const send = useCallback((event: PetAnimationMachineEvent | ManualPetAnimationEvent) => {
    const before = machineRef.current;
    const next = petAnimationReducer(before, event);
    machineRef.current = next;
    if (before.phase !== next.phase || before.active?.id !== next.active?.id) {
      // Protect the interval between a synchronous input and its next effect:
      // a background event here must not capture the previous action's clock.
      const delay = event.type === "RESUME" ? resumeDelayRef.current ?? phaseDurationMs(next) : phaseDurationMs(next);
      if (delay !== null) deadlineRef.current = Date.now() + delay;
    }
    dispatch(event);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (machine.phase === "idle" || machine.phase === "paused") return;

    const normalDelay = phaseDurationMs(machine);
    if (normalDelay === null) return;
    const delay = resumeDelayRef.current ?? normalDelay;
    resumeDelayRef.current = null;
    deadlineRef.current = Date.now() + delay;
    const id = machine.active?.id;
    const phase = machine.phase;
    timerRef.current = setTimeout(() => {
      if (machineRef.current.active?.id === id && machineRef.current.phase === phase) send({ type: "ADVANCE" });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [machine.active?.durationMs, machine.active?.id, machine.active?.manual, machine.phase, send]);

  useEffect(() => {
    if (machine.restTapAt === null || machine.phase !== "playing" || !machine.active?.rest) return;
    const { id } = machine.active;
    const at = machine.restTapAt;
    // Resolve just after the inclusive 300ms window to accept a tap at 300ms.
    const timer = setTimeout(() => send({ type: "REST_SINGLE_TIMEOUT", id, at }), Math.max(0, at + REST_DOUBLE_TAP_MS + 1 - Date.now()));
    return () => clearTimeout(timer);
  }, [machine.active?.id, machine.active?.rest, machine.phase, machine.restTapAt, send]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (nextState !== "active" && previousState === "active") {
        const current = machineRef.current;
        if (current.active && current.phase !== "idle" && current.phase !== "paused") {
          pausedRemainingRef.current = phaseDurationMs(current) === null ? null : Math.max(0, deadlineRef.current - Date.now());
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = null;
          send({ type: "PAUSE" });
        }
      } else if (nextState === "active" && previousState !== "active" && machineRef.current.phase === "paused") {
        resumeDelayRef.current = pausedRemainingRef.current;
        pausedRemainingRef.current = null;
        send({ type: "RESUME" });
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [send]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    machineRef.current = initialPetAnimationState;
    for (const waiter of waiters.current) waiter.resolve(false);
    waiters.current.clear();
  }, []);

  const play = useCallback((input: PlayInput) => {
    const id = input.id ?? `pet-animation-${Date.now()}-${sequenceRef.current += 1}`;
    const event: PetAnimationMachineEvent = {
      type: "REQUEST",
      request: {
        id,
        state: input.state,
        message: input.message,
        durationMs: Math.max(600, input.durationMs),
        priority: input.priority ?? "interaction",
        manual: input.manual,
        rest: input.rest,
        restNative: input.restNative,
      },
      startPaused: appStateRef.current !== "active",
    };
    const before = machineRef.current;
    const after = petAnimationReducer(before, event);
    if (after === before) return null;
    send(event);
    return id;
  }, [send]);

  const cancelActive = useCallback(() => send({ type: "CANCEL_ACTIVE" }), [send]);
  const cancelById = useCallback((id: string) => send({ type: "CANCEL_ID", id }), [send]);
  const finishManual = useCallback((id: string) => send({ type: "FINISH_MANUAL", id }), [send]);
  const finishRestStage = useCallback((id:string,stage:RestStage)=>send({type:"REST_NATIVE_FINISHED",id,stage}),[send]);
  const clearAll = useCallback(() => send({ type: "CLEAR" }), [send]);
  const updateMessage = useCallback((id: string, message: string) => send({ type: "UPDATE_MESSAGE", id, message }), [send]);
  const restStage = restStageFor(machine);
  const tapRest = useCallback(() => {
    const current = machineRef.current;
    if (current.active?.rest) send({ type: "REST_TAP", id: current.active.id, at: Date.now() });
  }, [send]);
  const wakeRest = useCallback((reason: RestWakeReason = "doubleTap") => {
    const current = machineRef.current;
    if (current.active?.rest) send({ type: "WAKE_REST", id: current.active.id, reason });
  }, [send]);
  const triggerYawn = useCallback((nativePlayback=false) => play({ state: "sleeping", rest: true, restNative:nativePlayback, message: REST_MESSAGES.Rest_Enter, durationMs: REST_DURATION_MS }), [play]);
  const setIsResting = useCallback((value: boolean) => {
    if (!value) { wakeRest("action"); return null; }
    return triggerYawn();
  }, [triggerYawn, wakeRest]);
  const isBusy = machine.phase === "paused" || (machine.phase !== "idle" && machine.active?.priority !== "tap" && restStage !== "Rest_Loop");

  return {
    active: machine.active,
    cancelActive,
    cancelById,
    clearAll,
    finishManual,
    finishRestStage,
    isBusy,
    isPaused: machine.phase === "paused",
    message: restStage ? (machine.active?.restNative?NATIVE_REST_MESSAGES:REST_MESSAGES)[restStage] : machine.active?.message ?? fallbackMessage,
    phase: machine.phase,
    play,
    queueLength: machine.queue.length,
    updateMessage,
    restStage,
    restControls: restControls(restStage),
    isResting: restControls(restStage).isResting,
    setIsResting,
    triggerYawn,
    triggerWakeUp: wakeRest,
    restFeedbackKey: machine.restFeedback,
    restWakeReason: machine.restWakeReason,
    tapRest,
    wakeRest,
    whenActive,
    whenRestExit,
    visualState: machine.active?.state ?? fallbackState,
  };
}
