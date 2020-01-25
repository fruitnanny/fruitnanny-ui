<template>
  <v-container>
    <!-- <v-system-bar></v-system-bar> -->
    <v-row justify="center">
      <v-col xs="12" md="8" lg="6">
        <v-responsive :aspect-ratio="4 / 3">
          <video
            class="remote-video"
            ref="video"
            autoplay=""
            playsinline=""
            :muted="muted"
            :controls="nativeControls"
            v-on:volumechange="syncVolume"
          ></video>
        </v-responsive>
      </v-col>
    </v-row>

    <v-row justify="center" class="text-center">
      <v-col xs="12" md="8" lg="6">
        <v-btn
          v-if="connected"
          class="mx-2 white--text"
          fab
          color="red"
          @click="disconnect"
        >
          <v-icon>mdi-stop</v-icon>
        </v-btn>
        <v-btn
          v-else
          class="mx-2 white--text"
          fab
          color="green"
          @click="connect"
        >
          <v-icon>mdi-play</v-icon>
        </v-btn>

        <v-btn
          v-if="muted"
          class="mx-2 white--text"
          color="primary"
          fab
          @click="unmute"
        >
          <v-icon>mdi-volume-off</v-icon>
        </v-btn>
        <v-btn v-else class="mx-2" fab @click="mute">
          <v-icon>mdi-volume-high</v-icon>
        </v-btn>

        <v-btn v-if="light" color="primary" class="mx-2" fab @click="lightOff">
          <v-icon>mdi-flashlight-off</v-icon>
        </v-btn>
        <v-btn v-else class="mx-2" fab @click="lightOn">
          <v-icon>mdi-flashlight</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="!nativeControls" justify="center">
      <v-col xs="12" md="8" lg="6">
        <v-slider
          v-model="volume"
          :disabled="muted"
          prepend-icon="mdi-volume-medium"
          append-icon="mdi-volume-high"
        ></v-slider>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col xs="12" md="8" lg="6">
        <v-switch
          v-model="nativeControls"
          color="primary"
          label="Native controls"
        ></v-switch>
      </v-col>
    </v-row>
  </v-container>
</template>

<style type="text/css">
.remote-video {
  background: #37474f;
  width: 100%;
  height: 100%;
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SignalingChannel } from "../rtc/signaling";
import { establishPeerConnection } from "../rtc/peer-connection";
import { iOS } from "../platforms";

function randomString(length: number = 5, charSet: string = "0123456789") {
  let result = [];
  while (length--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return result.join("");
}

@Component
export default class Camera extends Vue {
  $refs!: {
    video: HTMLVideoElement;
  };
  nativeControls = true;
  volume = 100;
  light = false;

  muted = false;
  connected = false;

  signaling: SignalingChannel | null = null;
  peerConnection: RTCPeerConnection | null = null;

  data() {
    return {
      nativeControls: iOS()
    };
  }

  mounted() {
    this.$refs.video.volume = this.volume / 100;
  }

  async connect() {
    if (this.connected) {
      return;
    }
    this.connected = true;

    const scheme = "ws";
    const host = "fruitnanny.local:8889" || location.host;
    const path = "/rws/ws";

    const url = `${scheme}://${host}${path}`;

    this.signaling = new SignalingChannel(url);
    this.peerConnection = establishPeerConnection(this.signaling);

    try {
      // No Room concept, random generate room and client id.
      await this.signaling.register({
        room: randomString(9),
        client: randomString(8)
      });
    } catch (e) {
      console.error(e);
      this.disconnect();
      return;
    }

    this.peerConnection.addEventListener("track", ev => {
      if (ev.streams.length > 0) {
        this.$refs.video.srcObject = ev.streams[0];
      }
    });

    this.peerConnection.addEventListener("close", () => this.disconnect());
  }

  disconnect() {
    if (!this.connected) {
      return;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.signaling) {
      this.signaling.close();
      this.signaling = null;
    }
    this.connected = false;
    if (this.$refs.video) {
      this.$refs.video.srcObject = null;
    }
  }

  destroyed() {
    this.disconnect();
  }

  play() {
    if (this.connected) {
      this.$refs.video.play();
    } else {
      this.connect();
    }
  }

  pause() {
    this.$refs.video.pause();
  }

  mute() {
    this.muted = true;
    this.$refs.video.muted = true;
  }

  unmute() {
    this.muted = false;
    this.$refs.video.muted = false;
  }

  lightOn() {
    this.light = true;
  }

  lightOff() {
    this.light = false;
  }

  @Watch("volume")
  onVolumeChanged(volume: number) {
    if (this.$refs.video) {
      this.$refs.video.volume = volume / 100;
    }
  }

  syncVolume(ev: Event) {
    this.volume = (ev.target as HTMLVideoElement).volume * 100;
  }
}
</script>
