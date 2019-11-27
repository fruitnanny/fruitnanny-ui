<template>
  <v-container class="fill-height text-center" fluid>
    <v-row>
      <v-col cols="12">
        <video></video>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4"></v-col>
      <v-col cols="4">
        <v-btn class="mx-2" fab color="primary" @click="onPlay">
          <v-icon v-if="play">mdi-play</v-icon>
          <v-icon v-else>mdi-pause</v-icon>
        </v-btn>
        <v-btn class="mx-2" fab @click="onMute">
          <v-icon v-if="mute">mdi-volume-off</v-icon>
          <v-icon v-else>mdi-volume-high</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-slider
          v-model="volume"
          v-if="!mute"
          prepend-icon="mdi-volume-low"
          append-icon="mdi-volume-high"
          label="Volume"
        ></v-slider>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class Camera extends Vue {
  volume = 100;
  play = true;
  mute = false;

  onPlay() {
    this.play = !this.play;
  }
  onMute() {
    this.mute = !this.mute;
  }
}
</script>
