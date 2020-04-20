<template>
  <v-container>
    <!-- <v-system-bar></v-system-bar> -->
    <v-row class="text-center" justify="center" align="center">
      <v-col lg="3" v-if="!sensorOverlay && $vuetify.breakpoint.lgAndUp">
        <v-icon large left>mdi-thermometer</v-icon>
        <v-progress-circular
          :rotate="-90"
          :size="80"
          :width="10"
          :value="(temperature / (2 * 17)) * 100"
          color="blue"
          :elevation="1"
        >
          {{ temperature }} °C
        </v-progress-circular>
      </v-col>

      <v-col xs="12" md="8" lg="6">
        <v-responsive :aspect-ratio="4 / 3">
          <div class="temperature-meter overlay" v-if="sensorOverlay">
            <v-icon color="white" large left>mdi-thermometer</v-icon>
            <v-progress-circular
              :rotate="-90"
              :size="70"
              :width="8"
              :value="(temperature / (2 * 17)) * 100"
              color="white"
            >
              {{ temperature }} °C
            </v-progress-circular>
          </div>

          <video
            class="remote-video"
            ref="video"
            autoplay=""
            playsinline=""
            :muted="muted"
            :controls="nativeControls"
            v-on:volumechange="syncVolume"
          ></video>

          <div class="humidity-meter overlay" v-if="sensorOverlay">
            <v-progress-circular
              :rotate="-90"
              :size="70"
              :width="8"
              :value="humidity"
              color="white"
            >
              {{ humidity }} %
            </v-progress-circular>
            <v-icon color="white" large right>mdi-water-percent</v-icon>
          </div>

          <canvas
            v-if="sensorOverlay"
            class="volume-meter overlay"
            height="50"
            ref="canvas"
          ></canvas>
        </v-responsive>
      </v-col>

      <v-col lg="3" v-if="!sensorOverlay && $vuetify.breakpoint.lgAndUp">
        <v-progress-circular
          :rotate="-90"
          :size="80"
          :width="10"
          :value="humidity"
          color="blue"
        >
          {{ humidity }} %
        </v-progress-circular>
        <v-icon large right>mdi-water-percent</v-icon>
      </v-col>
    </v-row>

    <v-row
      justify="center"
      class="text-center"
      v-if="!sensorOverlay && $vuetify.breakpoint.mdAndDown"
    >
      <v-col xs="6" md="4" lg="3">
        <v-icon large left>mdi-thermometer</v-icon>
        <v-progress-circular
          :rotate="-90"
          :size="80"
          :width="10"
          :value="(temperature / (2 * 17)) * 100"
          color="blue"
        >
          {{ temperature }} °C
        </v-progress-circular>
      </v-col>
      <v-col xs="6" md="4" lg="3">
        <v-progress-circular
          :rotate="-90"
          :size="80"
          :width="10"
          :value="humidity"
          color="blue"
        >
          {{ humidity }} %
        </v-progress-circular>
        <v-icon large right>mdi-water-percent</v-icon>
      </v-col>
    </v-row>

    <v-row justify="center" v-if="!sensorOverlay">
      <v-col xs="12" md="8" lg="6">
        <canvas class="volume-meter" height="50" ref="canvas"></canvas>
      </v-col>
    </v-row>

    <v-row justify="center" class="text-center">
      <v-col xs="12" md="8" lg="6">
        <v-btn v-if="muted" class="mx-2" color="primary" fab @click="unmute">
          <v-icon>mdi-volume-off</v-icon>
        </v-btn>
        <v-btn v-else class="mx-2" fab @click="mute">
          <v-icon>mdi-volume-high</v-icon>
        </v-btn>

        <v-btn
          v-if="connected"
          class="mx-2"
          fab
          x-large
          color="primary"
          @click="disconnect"
        >
          <v-icon>mdi-stop</v-icon>
        </v-btn>
        <v-btn
          v-else
          class="mx-2 white--text"
          fab
          x-large
          color="green"
          @click="connect"
        >
          <v-icon>mdi-play</v-icon>
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
        <!-- <v-switch
          v-model="sensorOverlay"
          color="primary"
          label="Sensor overlay"
        ></v-switch> -->
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
.volume-meter {
  display: block;
  width: 100%;
}
.volume-meter.overlay {
  position: absolute;
  bottom: 3px;
  opacity: 0.6;
}
.temperature-meter.overlay,
.humidity-meter.overlay {
  position: absolute;
  opacity: 0.6;
  top: 10px;
  text-shadow: 0px 0px 2px #333;
  font-size: 13px;
}
/*.temperature-meter circle,
.humidity-meter circle {
  box-shadow: 0px 0px 2px 0px #333;
}*/
.volume-meter.overlay,
.temperature-meter.overlay,
.humidity-meter.overlay {
  pointer-events: none;
}
.temperature-meter.overlay {
  left: 0;
}
.humidity-meter.overlay {
  right: 0;
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { SignalingChannel } from "../rtc/signaling";
import { establishPeerConnection } from "../rtc/peer-connection";
import { VolumeMeter } from "../rtc/volume-meter";
import { iOS } from "../platforms";
import { getLights, updateLights, readSensors } from "../api";

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
    canvas: HTMLCanvasElement;
  };
  nativeControls = true;
  volume = 100;
  light = false;

  muted = false;
  connected = false;

  signaling: SignalingChannel | null = null;
  peerConnection: RTCPeerConnection | null = null;
  volumeMeter: VolumeMeter | null = null;

  temperature: number = 0;
  humidity: number = 0;
  sensorTimer: number = -1;
  readonly sensorDelay = 10000;

  sensorOverlay = false;

  get volumeMeterColor(): string {
    if (this.sensorOverlay) {
      return "#fff";
    } else {
      return "#64B5F6";
    }
  }

  get volumeMeterBorder(): string {
    if (this.sensorOverlay) {
      return "#999";
    } else {
      return "";
    }
  }

  data() {
    return {
      nativeControls: iOS()
    };
  }

  async created() {
    this.light = await getLights();

    await this.fetchSensors();
    this.sensorTimer = setInterval(() => this.fetchSensors(), this.sensorDelay);
  }

  async mounted() {
    this.$refs.video.volume = this.volume / 100;
  }

  async fetchSensors() {
    const data = await readSensors();
    this.temperature = data.temperature;
    this.humidity = data.humidity;
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
      if (ev.track.kind === "audio") {
        if (this.volumeMeter) {
          this.volumeMeter.close();
          this.volumeMeter = null;
        }
        this.volumeMeter = new VolumeMeter(
          ev.track,
          this.$refs.canvas,
          this.volumeMeterColor,
          this.volumeMeterBorder
        );
      }
    });

    if (this.peerConnection.connectionState != undefined) {
      this.peerConnection.addEventListener("connectionstatechange", ev => {
        if (this.peerConnection) {
          if (this.peerConnection.connectionState === "closed") {
            this.disconnect();
          }
        }
      });
    }
    // Older browsers that do not supprt the "connectionState" API yet.
    else {
      this.peerConnection.addEventListener("signalingstatechange", ev => {
        if (this.peerConnection) {
          if (this.peerConnection.signalingState === "closed") {
            this.disconnect();
          }
        }
      });
    }
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }
    if (this.volumeMeter) {
      this.volumeMeter.close();
      this.volumeMeter = null;
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
    await this.lightOff();
  }

  destroyed() {
    this.disconnect();
    clearInterval(this.sensorTimer);
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

  async lightOn() {
    this.light = await updateLights(true);
  }

  async lightOff() {
    this.light = await updateLights(false);
  }

  @Watch("volume")
  onVolumeChanged(volume: number) {
    if (this.$refs.video) {
      this.$refs.video.volume = volume / 100;
    }
  }

  @Watch("$vuetify.theme.dark")
  onDarkModeChanged() {
    if (this.volumeMeter) {
      this.volumeMeter.color = this.volumeMeterColor;
      this.volumeMeter.border = this.volumeMeterBorder;
    }
  }

  syncVolume(ev: Event) {
    this.volume = (ev.target as HTMLVideoElement).volume * 100;
  }
}
</script>
