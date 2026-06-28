/**
 * store.js — Minimal reactive store (pub/sub pattern).
 *
 * API:
 *   store.get()            → shallow copy of current state snapshot
 *   store.set(key, value)  → update one key; notifies all subscribers
 *   store.reset(nextState) → replace full state; notifies all subscribers
 *   store.subscribe(fn)    → registers a listener; returns an unsubscribe fn
 *
 * Components call subscribe() in their mount function and unsubscribe
 * via the returned function if they are ever torn down.
 *
 * The store is intentionally framework-agnostic — no Proxy, no Signals,
 * just a Set of callbacks. Easy to swap for a more powerful solution later.
 *
 * @param {{ [key: string]: number }} initialState
 */
export function createStore(initialState) {
  let state = { ...initialState };
  const subscribers = new Set();

  /** Notify all subscribers with a snapshot of current state. */
  function notify() {
    const snapshot = { ...state };
    subscribers.forEach(fn => fn(snapshot));
  }

  return {
    /** Return a shallow copy of the current state. */
    get() {
      return { ...state };
    },

    /** Update a single key and notify subscribers. */
    set(key, value) {
      state[key] = value;
      notify();
    },

    /**
     * Replace the entire state (e.g. reset to defaults) and notify.
     * @param {{ [key: string]: number }} nextState
     */
    reset(nextState) {
      state = { ...nextState };
      notify();
    },

    /**
     * Register a subscriber callback. Called with a state snapshot on every change.
     * @param {(state: object) => void} fn
     * @returns {() => void} unsubscribe function
     */
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
