// Authored frame numbers are 1-based in the specification; Lottie uses 0..74.
export const CLEAN_FPS = 15;
export const CLEAN_FRAME_COUNT = 75;
export const CLEAN_VISUAL_MS = 5000;
export const CLEAN_DURATION_MS = CLEAN_VISUAL_MS;
export const CLEAN_CANVAS = 1024;
export const CLEAN_MESSAGES = [
  "Bath time! A little splash…",
  "Warm water and a cloud of bubbles.",
  "Sway left… sway right… so cozy!",
  "One more happy bubble dance.",
  "Ready… shake, shake!",
  "All fresh! +Clean",
] as const;
export const CLEAN_STAGE_FRAMES = [
  [0,"trigger"],[7,"water-foam"],[25,"enjoy-loop-1"],
  [43,"enjoy-loop-2"],[61,"shake"],[70,"reward"],
] as const;
export const CLEAN_MESSAGE_EVENTS = CLEAN_STAGE_FRAMES.map(([frame],i)=>[frame*1000/CLEAN_FPS,i] as const);
export type CleanStage = typeof CLEAN_STAGE_FRAMES[number][1];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function cleanStage(ms:number):CleanStage {
  let stage:CleanStage="trigger";
  for(const [frame,next]of CLEAN_STAGE_FRAMES)if(ms>=frame*1000/CLEAN_FPS)stage=next;
  return stage;
}
export function cleanMessage(ms:number) {
  let message:typeof CLEAN_MESSAGES[number]=CLEAN_MESSAGES[0];
  for(const [at,i]of CLEAN_MESSAGE_EVENTS)if(ms>=at)message=CLEAN_MESSAGES[i]!;
  return message;
}
export function cleanSnapshot(progress:number) {
  const ms=clamp(progress)*CLEAN_VISUAL_MS;
  return {stage:cleanStage(ms),frame:Math.min(74,Math.floor(ms*CLEAN_FPS/1000)),complete:progress>=1,message:cleanMessage(ms)};
}
// Only ambient room chrome uses this native clock. Lottie owns its own frame
// playback and is the sole source of the action-completed event.
export const CLEAN_INPUT = [0,.04,.10,.90,.96,1];
export const CLEAN_SCENE_PATH = CLEAN_INPUT.map(p=>({
  cameraScale:1+(p===0||p===1?0:p===.04?.025:.065),
  ambienceOpacity:p===0||p===1?0:.08,
}));
// The Lottie composition owns both the bubbles hint and +Clean feedback.
// Hide the external speech bubble for the whole film to avoid duplicate UI.
export const CLEAN_SPEECH_OPACITY = CLEAN_INPUT.map(()=>0);
