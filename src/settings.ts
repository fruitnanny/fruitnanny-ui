import { iOS } from "./platforms";

const DARK_MODE = "settings.darkMode";
const USE_NATIVE_CONTROLS = "settings.useNativeControls";

export function readDarkMode(): boolean {
  const darkMode = localStorage.getItem(DARK_MODE);
  return darkMode === "true";
}

export function putDarkMode(state: boolean) {
  localStorage.setItem(DARK_MODE, JSON.stringify(state));
}

export function readUseNativeControls(): boolean {
  const useNativeControls = localStorage.getItem(USE_NATIVE_CONTROLS);

  // Use native controls by default on iOS devices. They have good built-in
  // controls.
  if (useNativeControls === null) {
    return iOS();
  }

  return useNativeControls === "true";
}

export function putUseNativeControls(state: boolean) {
  localStorage.setItem(USE_NATIVE_CONTROLS, JSON.stringify(state));
}
