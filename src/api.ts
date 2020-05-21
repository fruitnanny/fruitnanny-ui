export function urlFor(path: string): string {
  return `${document.location.origin}${path}`;
}

export function signalingUrl(): string {
  return `ws://${document.location.hostname}:8889/rws/ws`;
}

export function poweroff(): Promise<void> {
  return fetch(urlFor("/api/system/poweroff"), {
    method: "POST"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

export function reboot(): Promise<void> {
  return fetch(urlFor("/api/system/reboot"), {
    method: "POST"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

type UpdateStatus = "recent" | "available";

interface UpdateResponse {
  "fruitnanny-api": UpdateStatus;
  "fruitnanny-ui": UpdateStatus;
  rws: UpdateStatus;
}

async function _readUpdates(url: string): Promise<boolean> {
  let response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  let status: UpdateResponse = await response.json();
  return (
    status["fruitnanny-ui"] === "available" ||
    status["fruitnanny-api"] === "available" ||
    status.rws === "available"
  );
}

export async function readUpdates(download = false): Promise<boolean> {
  return _readUpdates(urlFor("/api/updates"));
}

export async function readUpdatesWithDownload(): Promise<boolean> {
  return _readUpdates(urlFor("/api/updates?download"));
}

export async function upgrade(): Promise<void> {
  let response = await fetch(urlFor("/api/upgrade"), {
    method: "PUT"
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
}

interface connectivity {
  connectivity: string;
}

export function readConnectivity(): Promise<string> {
  return fetch(urlFor("/api/connectivity"))
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<connectivity>;
    })
    .then(c => {
      return c.connectivity;
    });
}

interface LightState {
  state: boolean;
}

export function getLight(): Promise<boolean> {
  return fetch(urlFor("/api/light"))
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((light: LightState) => {
      return light.state;
    });
}

export function updateLight(state: boolean): Promise<boolean> {
  return fetch(urlFor("/api/light"), {
    method: "PUT",
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
    .then((light: LightState) => {
      return light.state;
    });
}

export interface SensorData {
  temperature: number;
  humidity: number;
}

export function readSensors(): Promise<SensorData> {
  return fetch(urlFor("/api/sensors")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  });
}

export interface Connection {
  type: "wifi" | "hotspot";
  id: string;
  name: string;
  ssid: string;
  autoconnect: boolean;
  priority: number;
}

export function listConnections(): Promise<Connection[]> {
  return fetch(urlFor("/api/connections")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Connection[]>;
  });
}

export function readConnection(id: string): Promise<Connection> {
  return fetch(urlFor(`/api/connections/${id}`)).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Connection>;
  });
}

export function deleteConnection(id: string): Promise<void> {
  return fetch(urlFor(`/api/connections/${id}`), {
    method: "DELETE"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

export function updateConnection(connection: Connection): Promise<Connection> {
  return fetch(urlFor(`/api/connections/${connection.id}`), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(connection)
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Connection>;
  });
}

interface Checkpoint {
  id: number;
  created: number;
  rollbackTimeout: number;
}

export interface CheckpointCreateOptions {
  rollbackTimeout?: number;
  overwrite?: boolean;
}

export function createCheckpoint(
  options?: CheckpointCreateOptions
): Promise<Checkpoint> {
  let body = undefined;
  if (options) {
    body = JSON.stringify(options);
  }
  return fetch(urlFor("/api/checkpoint"), {
    method: "PUT",
    body: body
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Checkpoint>;
  });
}

export function readCheckpoint(): Promise<Checkpoint> {
  return fetch(urlFor("/api/checkpoint")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Checkpoint>;
  });
}

export interface CheckpointDeleteOptions {
  mode: "destroy" | "rollback";
}

export function deleteCheckpoint(
  options: CheckpointDeleteOptions,
  timeout?: number
): Promise<void> {
  let signal: AbortSignal | undefined = undefined;

  if (timeout === undefined) {
    const controller = new AbortController();
    signal = controller.signal;
    setTimeout(() => controller.abort(), timeout);
  }

  return fetch(urlFor("/api/checkpoint"), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options),
    signal
  }).then((response: Response) => {
    // HTTP 410 Gone is acceptable. It means the checkpoint was already
    // deleted.
    if (response.status == 410 && !response.ok) {
      throw new Error(response.statusText);
    }
  });
}

export function readActiveConnection(): Promise<Connection> {
  return fetch(urlFor("/api/active-connection")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Connection>;
  });
}

export interface ActivateHotspotOptions {
  type: "hotspot";
}

export interface ActivateWifiOptions {
  type: "wifi";
  id: string;
}

export type ActivateOptions = ActivateHotspotOptions | ActivateWifiOptions;

export function activate(options: ActivateOptions): Promise<Connection> {
  return fetch(urlFor("/api/active-connection"), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options)
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Connection>;
  });
}

export interface ConnectOptions {
  ssid: string;
  password: string | null;
}

export function connect(options: ConnectOptions): Promise<Connection> {
  return fetch(urlFor("/api/active-connection"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options)
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Connection>;
  });
}

export function disconnect(): Promise<void> {
  return fetch(urlFor("/api/active-connection"), {
    method: "DELETE"
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  });
}

export interface Hotspot {
  type: string;
  password: string;
  ssid: string;
}

export function readHotspot(): Promise<Hotspot> {
  return fetch(urlFor("/api/hotspot")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Hotspot>;
  });
}

export function updateHotspot(hotspot: Hotspot): Promise<Hotspot> {
  return fetch(urlFor("/api/hotspot"), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(hotspot)
  }).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Hotspot>;
  });
}

export interface AccessPoint {
  ssid: string;
  strength: number;
  mode: "ad-hoc" | "infrastructure";
  rsn: boolean;
}

export function listAccessPoints(): Promise<AccessPoint[]> {
  return fetch(urlFor("/api/access-points")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<AccessPoint[]>;
  });
}

/**
 * @param timeout  Rollback timeout in seconds
 */
export async function withCheckpoint(
  action: () => Promise<any>,
  timeout: number = 60
) {
  let options: CheckpointCreateOptions = {
    rollbackTimeout: timeout
  };

  // TODO: Better error message, e.g. 409 Conflict means checkpoint already exists.
  const checkpoint = await createCheckpoint(options);

  // Do not wait for the action because the connection could be disrupted by
  // it.
  action();

  await new Promise(resolve => setTimeout(resolve, 2000));

  let cleared = false;
  while (!cleared) {
    try {
      await deleteCheckpoint(
        {
          mode: "destroy"
        },
        5000
      );
      cleared = true;
    } catch (err) {
      console.error(err);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export interface Settings {
  temperatureOffset: number;
  humidityOffset: number;
}

export async function readSettings() {
  return fetch(urlFor("/api/settings")).then((response: Response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<Settings>;
  });
}

export function updateSettings(settings: Settings): Promise<Settings> {
  return fetch(urlFor("/api/settings"), {
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
    return response.json() as Promise<Settings>;
  });
}
