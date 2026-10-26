import { useCallback, useEffect, useReducer, useRef } from "react";
import { vetStageDelay, vetVisitReducer, type VetEvent } from "./vetVisit";

export function useVetVisit({ activeId, paused, onFinished }: { activeId?: string; paused: boolean; onFinished: (id: string) => void }) {
  const [visit, dispatch] = useReducer(vetVisitReducer, null);
  const visitRef = useRef(visit);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const send = useCallback((event: VetEvent) => {
    visitRef.current = vetVisitReducer(visitRef.current, event);
    dispatch(event);
  }, []);
  const timing = useRef({ key: "", remaining: 0 });

  useEffect(() => {
    if (visitRef.current && visitRef.current.id !== activeId) send({ type: "CLEAR" });
  }, [activeId, send]);

  useEffect(() => {
    const delay = vetStageDelay(visit);
    const key = visit ? `${visit.id}:${visit.stage}:${visit.applied}` : "";
    if (timing.current.key !== key) timing.current = { key, remaining: delay ?? 0 };
    if (!visit || delay === null || paused || visit.id !== activeId) return;
    const started = Date.now();
    const timer = setTimeout(() => {
      if (visitRef.current?.id !== visit.id || visitRef.current.stage !== visit.stage) return;
      timing.current.remaining = 0;
      if (visit.stage === "checking") send({ type: "CHECKED", id: visit.id });
      else if (visit.stage === "treating") send({ type: "TREAT_FINISHED", id: visit.id });
      else if (visit.stage === "happy") finishedRef.current(visit.id);
    }, timing.current.remaining);
    return () => {
      clearTimeout(timer);
      if (timing.current.key === key) timing.current.remaining = Math.max(0, timing.current.remaining - (Date.now() - started));
    };
  }, [activeId, paused, send, visit]);

  return { visit, visitRef, send };
}
