export function urlFor(path: string): string {
  // return `http://localhost:9000${path}`;
  return `http://fruitnanny.local:9000${path}`;
}

export function poweroff(): Promise<void> {
  return fetch(urlFor("/system/poweroff"), {
    method: "POST"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

export function reboot(): Promise<void> {
  return fetch(urlFor("/system/reboot"), {
    method: "POST"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

interface LightsState {
  state: boolean;
}

export function getLights(): Promise<boolean> {
  return fetch(urlFor("/lights"))
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((light: LightsState) => {
      return light.state;
    });
}

export function updateLights(state: boolean): Promise<boolean> {
  return fetch(urlFor("/lights"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      state: state
    })
  })
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((light: LightsState) => {
      return light.state;
    });
}

export interface SensorData {
  temperature: number;
  humidity: number;
}

export function readSensors(): Promise<SensorData> {
  return fetch(urlFor("/sensors")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });
}

export interface ConnectionSettings {
  uuid: string;
  type: "ethernet" | "wireless";
  name: string;
  device: string | null;
  icon: string;
  last_used: number;
  autoconnect: boolean;
  autoconnect_priority: number;
  autoconnect_retries: number;
}

export interface WirelessSettings {
  ssid: string;
  mode: string;
}

export interface WirelessSecuritySettings {
  key_management: string;
  auth_algorithm: string | null;
  psk: string | null;
}

export interface Settings {
  connection: ConnectionSettings;
  wifi?: WirelessSettings;
  wifi_sec?: WirelessSecuritySettings;
}

export function listSettings(): Promise<Settings[]> {
  return fetch(urlFor("/network/settings")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });
}

export function deleteSettings(uuid: string): Promise<void> {
  return fetch(urlFor(`/network/settings/${uuid}`), {
    method: "DELETE"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

export function updateSettings(settings: Settings): Promise<void> {
  return fetch(urlFor(`/network/settings/${settings.connection.uuid}`), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(settings)
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

interface NetworkCheckpoint {
  path: string;
}

export function createCheckpoint(): Promise<NetworkCheckpoint> {
  return fetch(urlFor("/network/checkpoint"), {
    method: "POST"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<NetworkCheckpoint>;
  });
}

export function deleteCheckpoint(
  checkpoint: NetworkCheckpoint
): Promise<boolean> {
  return fetch(urlFor("/network/checkpoint"), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(checkpoint)
  }).then((response: Response) => {
    return response.ok;
  });
}

export interface ActiveConnection {
  uuid: string;
}

export function getActiveConnection(ifname: string): Promise<ActiveConnection> {
  return fetch(urlFor(`/network/connection/${ifname}`)).then(
    (response: Response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<ActiveConnection>;
    }
  );
}

export interface AccessPoint {
  id: number;
  ssid: string;
  mode: string;
  flags: number;
  wpa_flags: number;
  frequency: number;
  strength: number;
}

export function getAccessPoints(): Promise<AccessPoint[]> {
  return fetch(urlFor("/network/access-points")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<AccessPoint[]>;
  });
}

export async function activateConnection(
  ifname: string,
  uuid: string
): Promise<void> {
  return fetch(urlFor(`/network/connection/${ifname}`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uuid
    })
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}
