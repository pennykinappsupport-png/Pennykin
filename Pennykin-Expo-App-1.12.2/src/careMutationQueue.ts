// Chained care can start after the one-second wake animation while an earlier
// database write is still finishing. Serialize read/modify/write operations so
// a slow Rest write cannot overwrite the following Feed/Play changes.
export function createCareMutationQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(write: () => Promise<T>): Promise<T> {
      const result = tail.then(write, write);
      tail = result.catch(() => {});
      return result;
    },
  };
}
