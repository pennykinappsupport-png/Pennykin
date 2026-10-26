import { FEED_FIRST_BLEND_MS, FEED_PICKUP_SCALE, FEED_SPEECH_MS, FEED_TRANSITIONS } from "./feedChoreography";

// The same plan drives the mounted image views, feedback scale and bubble.
// The driver is injected so tests can advance the actual animation plan.
export interface FeedAnimationDriver<Value, Animation> {
  delay(ms: number): Animation;
  timing(value: Value, to: number, duration: number): Animation;
  spring(value: Value, to: number): Animation;
  sequence(animations: Animation[]): Animation;
  parallel(animations: Animation[]): Animation;
}
export interface FeedVisualValues<Value> {
  layers: Value[];
  visibility: Value;
  pickupScale: Value;
  speechOpacity: Value;
  speechScale: Value;
}

export function feedTimeline<Value, Animation>(driver: FeedAnimationDriver<Value, Animation>, values: FeedVisualValues<Value>, elapsed = 0): Animation {
  const entry = Math.max(elapsed, FEED_FIRST_BLEND_MS);
  let cursor = entry;
  const images: Animation[] = [];
  for (const transition of FEED_TRANSITIONS) {
    const end = transition.at + transition.duration;
    if (end <= elapsed) continue;
    const start = Math.max(elapsed, transition.at);
    if (start > cursor) images.push(driver.delay(start - cursor));
    images.push(driver.parallel([
      driver.timing(values.layers[transition.from]!, 0, end - start),
      driver.timing(values.layers[transition.to]!, 1, end - start),
    ]));
    cursor = end;
  }
  const after = (at: number, animation: Animation) => driver.sequence([driver.delay(Math.max(0, at - entry)), animation]);
  // Resuming uses the remaining duration, never restarts the preparation beat.
  const pickup = elapsed < FEED_FIRST_BLEND_MS + 70
    ? after(FEED_FIRST_BLEND_MS, driver.sequence([
      driver.timing(values.pickupScale, FEED_PICKUP_SCALE, FEED_FIRST_BLEND_MS + 70 - Math.max(elapsed, FEED_FIRST_BLEND_MS)),
      driver.spring(values.pickupScale, 1),
    ])) : driver.spring(values.pickupScale, 1);
  const speech = driver.parallel([
    after(FEED_SPEECH_MS, driver.timing(values.speechOpacity, 1, Math.max(0, FEED_SPEECH_MS + 120 - Math.max(elapsed, FEED_SPEECH_MS)))),
    after(FEED_SPEECH_MS, driver.spring(values.speechScale, 1)),
  ]);
  // The bubble's 100ms delay starts when the first posture fade actually
  // starts, even if the preparation callback was delayed by a busy JS thread.
  return driver.sequence([driver.delay(Math.max(0, FEED_FIRST_BLEND_MS - elapsed)), driver.parallel([driver.sequence(images), pickup, speech])]);
}
