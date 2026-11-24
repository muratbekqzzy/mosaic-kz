/** Resolves when the preloader has lifted — scenes wait for it to start their intros. */
let resolveReady: () => void = () => {};
export const ready: Promise<void> = new Promise((r) => (resolveReady = r));
export const markReady = () => resolveReady();
