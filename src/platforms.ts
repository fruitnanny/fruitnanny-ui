export function iOS() {
  if (!navigator.platform) {
    return false;
  }
  const iDevices = [
    "iPad Simulator",
    "iPhone Simulator",
    "iPod Simulator",
    "iPad",
    "iPhone",
    "iPod"
  ];
  return iDevices.includes(navigator.platform);
}
