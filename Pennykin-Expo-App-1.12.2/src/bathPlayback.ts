export interface BathPlayer {
  play(): void; pause(): void; resume(): void; reset(): void;
}
// Native Lottie is the playback owner. No frame timers or Animated.progress
// writes are sent to Lottie. React is involved only at lifecycle boundaries.
export function createBathPlayback(player: () => BathPlayer | null) {
  let runId: string | undefined;
  let started=false, paused=false, complete=false, disposed=false;
  return {
    activate(){if(disposed && started && !complete)paused=true;disposed=false;},
    sync(id: string | undefined, visible: boolean, shouldPause: boolean) {
      if(disposed)return;
      if(id !== runId || !visible) {
        player()?.pause();player()?.reset();
        runId=id;started=false;paused=false;complete=false;
      }
      if(!visible || complete)return;
      if(shouldPause) {
        if(started && !paused)player()?.pause();
        paused=true;return;
      }
      const current=player();
      if(!current)return; // Keep the start pending until a real view exists.
      if(!started){current.play();started=true;}
      else if(paused)current.resume();
      paused=false;
    },
    finish(id: string | undefined, cancelled: boolean, progress: number) {
      // The progress guard rejects a late previous-run finish delivered after
      // a new request starts on the same resident native view.
      if(disposed || cancelled || id!==runId || !started || complete || progress<.95)return false;
      complete=true;return true;
    },
    dispose(){disposed=true;player()?.pause();},
  };
}
