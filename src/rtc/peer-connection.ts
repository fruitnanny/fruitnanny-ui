import { SignalingChannel } from "./signaling";

export function establishPeerConnection(
  signaling: SignalingChannel,
  unsupportedCallback: (reason: string) => void
): RTCPeerConnection {
  const peerConnection = new RTCPeerConnection();

  peerConnection.addEventListener("icecandidate", ev => {
    if (ev.candidate) {
      const candidate = {
        type: "candidate",
        label: ev.candidate.sdpMLineIndex,
        id: ev.candidate.sdpMid,
        candidate: ev.candidate.candidate
      };
      console.info("[peer-connection] Send ICE candidate", candidate);
      signaling.send(candidate);
    } else {
      console.info("[peer-connection] End of candidates.");
    }
  });

  peerConnection.addEventListener("iceconnectionstatechange", ev => {
    console.debug(
      `[peer-connection] ICE connection state changed to "${peerConnection.iceConnectionState}"`
    );
  });

  peerConnection.addEventListener("signalingstatechange", ev => {
    console.debug(
      `[peer-connection] Signaling state changed to "${peerConnection.signalingState}"`
    );
  });

  peerConnection.addEventListener("connectionstatechange", () => {
    console.debug(
      `[peer-connection] Connection state changed to "${peerConnection.connectionState}"`
    );
  });

  signaling.on("offer", async (description: RTCSessionDescription) => {
    console.info("[peer-connection] Received offer", description);

    try {
      await peerConnection.setRemoteDescription(description);
    } catch (err) {
      if (err instanceof DOMException) {
        switch (err.name) {
          case "InvalidAccessError":
            // Chrome on Android:
            //   H.264 is not fully supported on all devices.
            if (
              err.message.indexOf(
                "Failed to set remote video description send parameters."
              ) !== -1
            ) {
              unsupportedCallback("Video codec not supported");
            } else {
              console.warn(
                "InvalidAccessError: The content of the description is invalid.",
                err.message
              );
            }
            break;
          case "InvalidStateError":
            console.warn("InvalidStateError: Connection in invalid state.");
            break;
          case "OperationError":
            console.warn("OperationError:", err.message);
            break;
          case "RTCError":
            console.warn("RTCError:", err.message);
            break;
          case "TypeError":
            console.warn("TypeError:", err.message);
            break;
          default:
            console.error(
              "Unknown error while setting remote description:",
              err
            );
            break;
        }
      } else {
        console.error("Failed to set remote description:", err);
      }
      return;
    }
    console.debug("[peer-connection] Added remote description");

    const answer = await peerConnection.createAnswer();
    console.debug("[peer-connection] Sent answer for offer");
    signaling.send(answer);
    await peerConnection.setLocalDescription(answer);

    console.debug("[peer-connection] Added local description");
  });

  signaling.on("candidate", async (candidate: RTCIceCandidate) => {
    console.info("[signaling] Received ICE candidate", candidate);

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (err) {
      if (err instanceof DOMException) {
        switch (err.name) {
          case "TypeError":
            console.warn("TypeError");
            break;
          case "InvalidStateError":
            console.warn(
              "InvalidStateError: connection has no remote peer established"
            );
            break;
          case "OperationError":
            // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1542370
            if (err.message.indexOf("No such transceiver.") !== -1) {
              peerConnection.addTransceiver("video", {
                direction: "recvonly"
              });
            } else {
              console.warn("OperationError:", err.message);
            }
            break;
          default:
            console.warn("Unknown error", err);
            break;
        }
      } else {
        console.error("Failed to add ICE candidate", err);
      }
    }
  });

  signaling.on("close", () => peerConnection.close());

  return peerConnection;
}
