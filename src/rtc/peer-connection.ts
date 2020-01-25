import { SignalingChannel } from "./signaling";

export function establishPeerConnection(
  signaling: SignalingChannel
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

  signaling.on("offer", async (description: RTCSessionDescription) => {
    console.info("[peer-connection] Received offer", description);

    await peerConnection.setRemoteDescription(description);
    console.debug("[peer-connection] Added remote description");

    const answer = await peerConnection.createAnswer();
    console.debug("[peer-connection] Sent answer for offer");
    signaling.send(answer);
    await peerConnection.setLocalDescription(answer);

    console.debug("[peer-connection] Added local description");
  });

  signaling.on("candidate", async (candidate: RTCIceCandidate) => {
    console.info("[signaling] Received ICE candidate", candidate);
    await peerConnection.addIceCandidate(candidate);
  });

  signaling.on("close", () => peerConnection.close());

  return peerConnection;
}
