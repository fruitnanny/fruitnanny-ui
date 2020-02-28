<template>
  <v-list subheader>
    <!-- <v-list-item
      @click="edit(activeConnection)"
      two-line
      :disabled="connecting"
    >
      <v-list-item-avatar>
        <v-progress-circular
          indeterminate
          color="primary"
          v-if="connecting"
        ></v-progress-circular>
        <v-icon color="primary" v-else>mdi-check</v-icon>
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title>{{ activeConnection.name }}</v-list-item-title>
      </v-list-item-content>

      <v-list-item-icon>
        <v-icon>mdi-lock</v-icon>
      </v-list-item-icon>

      <v-list-item-icon>
        <v-icon>{{ activeConnection.icon }}</v-icon>
      </v-list-item-icon>

      <v-list-item-action @click.stop.prevent="edit(activeConnection)">
        <v-btn icon color="accent">
          <v-icon>mdi-settings</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item> -->

    <v-subheader v-if="settings.length">My Networks</v-subheader>
    <v-list-item
      v-for="s in settings"
      :key="s.connection.uuid"
      @click="connect(s)"
      :disabled="connecting !== null"
    >
      <v-list-item-avatar>
        <v-progress-circular
          indeterminate
          color="primary"
          v-if="isConnecting(s)"
        ></v-progress-circular>
        <v-icon color="primary" v-else-if="isActive(s)">mdi-check</v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title v-text="s.connection.name"></v-list-item-title>
      </v-list-item-content>

      <v-list-item-icon v-if="isEncrypted(s)">
        <v-icon>mdi-lock</v-icon>
      </v-list-item-icon>

      <v-list-item-icon>
        <v-icon>{{ networkIcon(s) }}</v-icon>
      </v-list-item-icon>

      <v-list-item-action @click.stop="edit(s)">
        <v-btn icon color="accent">
          <v-icon>mdi-settings</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>

    <v-subheader>
      Other Networks
      <v-progress-circular
        class="ml-2"
        indeterminate
        size="16"
        width="2"
        v-if="accessPointsLoading"
      ></v-progress-circular>
    </v-subheader>
    <v-list-item
      v-for="accessPoint in otherNetworks"
      :key="accessPoint.id"
      @click="connectNew(accessPoint)"
      :disabled="connecting !== null"
      two-line
    >
      <v-list-item-avatar></v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title v-text="accessPoint.ssid"></v-list-item-title>
        <v-list-item-subtitle>
          Channel {{ accessPointChannel(accessPoint) }}
        </v-list-item-subtitle>
      </v-list-item-content>

      <v-list-item-icon v-if="isAccessPointEncrypted(accessPoint)">
        <v-icon>mdi-lock</v-icon>
      </v-list-item-icon>

      <v-list-item-icon>
        <v-icon>{{ accessPointIcon(accessPoint) }}</v-icon>
      </v-list-item-icon>

      <v-list-item-icon>
        <v-icon>{{ accessPointStrength(accessPoint) }}</v-icon>
      </v-list-item-icon>

      <!-- <v-list-item-icon>
        <v-progress-circular size="24" width="4" rotate="-90" :value="accessPoint.strength"></v-progress-circular>
      </v-list-item-icon> -->
    </v-list-item>

    <!-- <v-btn fixed dark fab bottom right color="pink" @click="newConnection">
      <v-icon>mdi-plus</v-icon>
    </v-btn> -->

    <v-dialog
      :value="isEditing"
      persistent
      @click:outside="close"
      max-width="600px"
    >
      <WLANSettings
        v-if="isEditing"
        :settings="editSettings"
        :disabled="isProcessing"
        @close="close"
        @save="save"
        @delete="deleteSettings"
      ></WLANSettings>
    </v-dialog>
  </v-list>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import WLANSettings from "./WLAN-Settings.vue";
import {
  Settings,
  ActiveConnection,
  AccessPoint,
  createCheckpoint,
  deleteCheckpoint,
  activateConnection
} from "../api";

// access point requires authentication and encryption (usually means WEP)
const NM_802_11_AP_FLAGS_PRIVACY = 0x00000001;

const channelMap: { [frequency: number]: number } = {
  2412: 1,
  2417: 2,
  2422: 3,
  2427: 4,
  2432: 5,
  2437: 6,
  2442: 7,
  2447: 8,
  2452: 9,
  2457: 10,
  2462: 11,
  2467: 12,
  2472: 13,
  2484: 14
};

function copy<T>(obj: T): T {
  if (obj === null) {
    return obj;
  }
  if (obj === undefined) {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  if (obj instanceof Array) {
    return obj.map((n: any) => copy<any>(n)) as any;
  }
  if (typeof obj === "object") {
    const _copy = { ...(obj as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(_copy).forEach(key => {
      _copy[key] = copy<any>(_copy[key]);
    });
    return _copy as T;
  }
  return obj;
}

@Component({
  components: {
    WLANSettings
  }
})
export default class WLAN extends Vue {
  connecting: Settings | null = null;
  loading: boolean = false;

  snackbar: boolean = false;

  @Prop() readonly settings!: Settings[];
  @Prop() readonly accessPoints!: AccessPoint[];
  @Prop() readonly accessPointsLoading!: boolean;
  @Prop() readonly active!: ActiveConnection | null;

  editSettings: Settings | null = null;
  processing: Promise<void> | null = null;

  get mySettings() {
    return this.settings.sort((a, b) =>
      Number(
        a.connection.autoconnect_priority > b.connection.autoconnect_priority
      )
    );
  }

  get isEditing(): boolean {
    return this.editSettings !== null;
  }

  get isProcessing(): boolean {
    return this.processing !== null;
  }

  isEncrypted(settings: Settings) {
    return true;
  }

  networkIcon(settings: Settings) {
    switch (settings.connection.type) {
      case "ethernet":
        return "mdi-network-outline";
      case "wireless":
        switch (settings.wifi!.mode) {
          case "ap":
            return "mdi-access-point";
          default:
            return "mdi-wifi";
        }
      default:
        return "";
    }
  }

  isAccessPointEncrypted(accessPoint: AccessPoint) {
    return Boolean(accessPoint.flags & NM_802_11_AP_FLAGS_PRIVACY);
  }

  accessPointStrength(accessPoint: AccessPoint) {
    if (accessPoint.strength >= 67) {
      return "mdi-signal-cellular-3";
    } else if (accessPoint.strength >= 33) {
      return "mdi-signal-cellular-2";
    } else {
      return "mdi-signal-cellular-1";
    }
  }

  accessPointIcon(accessPoint: AccessPoint) {
    switch (accessPoint.mode) {
      case "infra":
        return "mdi-wifi";
      case "ap":
        return "mdi-access-point";
      default:
        return "";
    }
  }

  accessPointChannel(accessPoint: AccessPoint) {
    return channelMap[accessPoint.frequency];
  }

  get otherNetworks(): AccessPoint[] {
    const knownSSIDs = this.settings.map(settings => settings.wifi!.ssid);

    return this.accessPoints
      .filter(accessPoint => !knownSSIDs.includes(accessPoint.ssid))
      .sort((a, b) => Number(a.strength < b.strength));
  }

  isActive(settings: Settings) {
    if (!this.active) {
      return false;
    }
    return settings.connection.uuid === this.active.uuid;
  }

  isConnecting(settings: Settings) {
    if (!this.connecting) {
      return false;
    }
    return settings.connection.uuid == this.connecting.connection.uuid;
  }

  edit(settings: Settings) {
    this.editSettings = copy(settings);
  }

  connect(settings: Settings) {
    if (this.connecting) {
      return;
    }

    this.connecting = settings;

    this.doConnect()
      .catch(error => {
        this.$emit("error", error);
      })
      .finally(() => {
        this.connecting = null;
      });
  }

  async doConnect() {
    // TODO: Better error message, e.g. 409 Conflict means checkpoint already exists.
    const checkpoint = await createCheckpoint();

    await activateConnection("wlan0", this.connecting!.connection.uuid);

    await new Promise(resolve => setTimeout(resolve, 2000));

    let cleared = false;
    while (!cleared) {
      try {
        console.debug("Try to clear checkpoint");
        await deleteCheckpoint(checkpoint);
        cleared = true;
      } catch (err) {
        console.error(err);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Promise(resolve => {
      this.$emit("reload", resolve);
    });
  }

  connectNew(networkName: AccessPoint) {}

  close() {
    // Clicks outside the dialog trigger "close" action. Prevent closing if
    // some action is in progress.
    if (this.isProcessing) {
      return;
    }
    this.editSettings = null;
  }

  async save() {
    if (this.processing) {
      return;
    }

    this.processing = new Promise((resolve, reject) => {
      this.$emit("save", this.editSettings, resolve, reject);
    });

    try {
      await this.processing;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Could not save network settings"
      });
      this.processing = null;
      return;
    }

    this.editSettings = null;
    this.processing = null;
  }

  async deleteSettings(settings: Settings) {
    if (this.processing) {
      return;
    }
    this.processing = new Promise((resolve, reject) => {
      this.$emit("delete", settings, resolve, reject);
    });
    try {
      await this.processing;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Could not delete network settings"
      });
      this.processing = null;
      return;
    }

    this.editSettings = null;
    this.processing = null;
  }

  newConnection() {}
}
</script>
