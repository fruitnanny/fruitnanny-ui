interface RegisterMessage {
  room: string;
  client: string;
}

interface OfferMessage {
  type: "offer";
  sdp: string;
}

interface CandidateMessage {
  type: "candidate";
  id: string;
  label: number;
  candidate: string;
}

interface RegisterCommand {
  cmd: "register";
  roomid: string;
  clientid: string;
}

interface SendCommand {
  cmd: "send";
  msg: string;
  error: string;
}

type Command = RegisterCommand | SendCommand;

export type OfferHandler = (offer: RTCSessionDescription) => void;
export type CandidateHandler = (candidate: RTCIceCandidate) => void;
export type CloseHandler = () => void;

export class SignalingChannel {
  websocket: WebSocket;
  closing = false;
  opened = false;
  _offerHandlers: OfferHandler[] = [];
  _candidateHandlers: CandidateHandler[] = [];
  _closeHandlers: CloseHandler[] = [];
  _connectPromise: Promise<never>;

  constructor(url: string) {
    console.debug("[signaling] Connect to signaling server:", url);

    const websocket = new WebSocket(url);
    const connectPromise = new Promise<never>((resolve, reject) => {
      websocket.addEventListener("open", () => {
        console.debug("[signaling] Connnected to ", websocket.url);
        resolve();
      });

      websocket.addEventListener("close", () => {
        reject(new Error("WebSocket closed"));

        if (this.closing) {
          console.debug("[signaling] Connection closed.");
        } else {
          console.warn("[signaling] Connection lost.");
        }
        this.trigger("close");
      });

      websocket.addEventListener("message", (ev: MessageEvent) => {
        let data;
        try {
          data = JSON.parse(ev.data);
        } catch (e) {
          console.error("[signaling] Received invalid message");
          console.debug("[signaling] >>>", ev.data);
          return;
        }
        this._handleMessage(data);
      });

      websocket.addEventListener("error", (err: Event) => {
        console.debug("An error occured while connecting: ", err);
        // TODO: need error handling
      });
    });

    this._connectPromise = connectPromise;
    this.websocket = websocket;
  }

  on(event: "offer", handler: OfferHandler): void;
  on(event: "candidate", handler: CandidateHandler): void;
  on(event: "close", handler: CloseHandler): void;
  on(
    event: "offer" | "candidate" | "close",
    handler: OfferHandler | CandidateHandler | CloseHandler
  ): void {
    if (event === "offer") {
      this._offerHandlers.push(<OfferHandler>handler);
    } else if (event === "candidate") {
      this._candidateHandlers.push(<CandidateHandler>handler);
    } else if (event === "close") {
      this._closeHandlers.push(<CloseHandler>handler);
    }
  }

  trigger(event: "offer", obj: OfferMessage): void;
  trigger(event: "candidate", obj: CandidateMessage): void;
  trigger(event: "close"): void;
  trigger(
    event: "offer" | "candidate" | "close",
    obj?: OfferMessage | CandidateMessage
  ) {
    if (event === "offer") {
      const description = new RTCSessionDescription(<OfferMessage>obj);
      this._offerHandlers.forEach(handler => handler(description));
    } else if (event === "candidate") {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: (<CandidateMessage>obj).label,
        sdpMid: (<CandidateMessage>obj).id,
        candidate: (<CandidateMessage>obj).candidate
      });
      this._candidateHandlers.forEach(handler => handler(candidate));
    } else if (event === "close") {
      this._closeHandlers.forEach(handler => handler());
    }
  }

  async register(info: RegisterMessage) {
    await this._connectPromise;
    this.sendJSON({
      cmd: "register",
      roomid: info.room,
      clientid: info.client
    });
  }

  send(message: object) {
    this.sendJSON({
      cmd: "send",
      msg: JSON.stringify(message),
      error: ""
    });
  }

  sendJSON(message: Command) {
    if (this.websocket.readyState != WebSocket.OPEN) {
      throw new Error("websocket not open");
    }
    console.debug("[signaling] <<<", message);
    const raw = JSON.stringify(message);
    this.websocket.send(raw);
  }

  close() {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.websocket.close();
  }

  _handleMessage(data: Command) {
    if (data.cmd === "send") {
      let message;
      try {
        message = JSON.parse(data.msg);
      } catch (e) {
        console.error(`[signaling] Received invalid "send" command`);
        console.debug("[signaling] >>>", data.msg);
        return;
      }
      if (message.type === "offer") {
        this.trigger("offer", message);
      } else if (message.type === "candidate") {
        this.trigger("candidate", message);
      } else {
        console.error(
          "[signaling] Received unknown message type",
          message.type
        );
        console.debug("[signaling] >>>", message);
      }
    } else {
      console.warn("[signaling] Received unknown command");
      console.debug("[signaling] >>>", data);
    }
  }
}
