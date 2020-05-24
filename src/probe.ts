import { readVersion } from "./api";

export async function probeHealthStatus(): Promise<boolean> {
  await readVersion(5);
  return true;
}

export function sleep(ms: number): Promise<never> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const ipv4Re = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export function connectedViaIpAddress(): boolean {
  return ipv4Re.test(document.location.hostname);
}
