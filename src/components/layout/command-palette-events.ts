const OPEN_COMMAND_PALETTE_EVENT = "sgnk-open-command";

export function openCommandPalette() {
  document.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

export function useCommandPalette() {
  return {
    open: openCommandPalette,
  };
}

export { OPEN_COMMAND_PALETTE_EVENT };
