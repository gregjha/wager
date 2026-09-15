import { useSyncExternalStore } from "react";

function getMediaQuerySnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

function subscribe(query: string, callback: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    getMediaQuerySnapshot(query),
    () => false,
  );
}
