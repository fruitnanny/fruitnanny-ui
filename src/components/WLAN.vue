<template>
  <div class="text-center pa-4" v-if="loading">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
  <v-list subheader v-else>
    <v-subheader v-if="myNetworks.length">My Networks</v-subheader>
    <v-list-item
      v-for="network in myNetworks"
      :key="network.connection.id"
      @click="activate(network.connection)"
      :disabled="activating !== null"
    >
      <v-list-item-avatar>
        <v-progress-circular
          indeterminate
          color="primary"
          v-if="isActivating(network.connection)"
        ></v-progress-circular>
        <v-icon color="accent" v-else-if="isActive(network.connection)"
          >mdi-check</v-icon
        >
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title v-text="network.connection.name"></v-list-item-title>
      </v-list-item-content>

      <v-list-item-action v-if="network.accessPoint && network.accessPoint.rsn">
        <v-icon dense>mdi-lock</v-icon>
      </v-list-item-action>

      <v-list-item-action v-if="network.accessPoint">
        <v-icon dense>{{ accessPointIcon(network.accessPoint) }}</v-icon>
      </v-list-item-action>

      <v-list-item-action v-if="network.accessPoint">
        <v-icon dense>{{ accessPointStrength(network.accessPoint) }}</v-icon>
      </v-list-item-action>

      <v-list-item-action @click.stop="edit(network.connection)">
        <v-btn icon color="primary">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>

    <v-subheader v-if="otherNetworks.length > 0 || accessPointsLoading">
      Other Networks
      <v-progress-circular
        class="ml-2"
        indeterminate
        size="16"
        width="2"
        v-if="accessPointsLoading"
      ></v-progress-circular>
    </v-subheader>
    <v-subheader v-else>
      No networks found
    </v-subheader>
    <v-list-item
      v-for="accessPoint in otherNetworks"
      :key="accessPoint.id"
      @click="connect(accessPoint)"
      :disabled="connecting !== null"
      two-line
    >
      <v-list-item-avatar>
        <v-progress-circular
          indeterminate
          color="accent"
          v-if="isConnecting(accessPoint)"
        ></v-progress-circular>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title v-text="accessPoint.ssid"></v-list-item-title>
      </v-list-item-content>

      <v-list-item-action v-if="accessPoint.rsn">
        <v-icon dense>mdi-lock</v-icon>
      </v-list-item-action>

      <v-list-item-action>
        <v-icon dense>{{ accessPointIcon(accessPoint) }}</v-icon>
      </v-list-item-action>

      <v-list-item-action>
        <v-icon dense>{{ accessPointStrength(accessPoint) }}</v-icon>
      </v-list-item-action>
    </v-list-item>

    <v-dialog
      :value="isEditing"
      persistent
      @click:outside="close"
      max-width="600px"
    >
      <WLANSettings
        v-if="isEditing"
        :connection="editConnection"
        :disabled="isProcessing"
        @close="close"
        @save="updateConnection"
        @delete="deleteConnection"
      ></WLANSettings>
    </v-dialog>

    <v-dialog
      :value="passwordDialog"
      @click:outside="closePasswordDialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          <span class="headline" v-if="passwordDialog">
            Connect to {{ passwordDialog.ssid }}
          </span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col>
                <v-text-field
                  label="Password"
                  required
                  type="password"
                  v-model="connectPassword"
                  @keydown.enter="connect(passwordDialog)"
                  :append-icon="showConnectPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append="showConnectPassword = !showConnectPassword"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue" text @click="closePasswordDialog">
            Cancel
          </v-btn>
          <v-btn
            color="blue"
            text
            @click="connect(passwordDialog)"
            :disabled="!connectPassword"
            >Connect</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-list>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import WLANSettings from "./WLAN-Settings.vue";
import {
  Connection,
  AccessPoint,
  withCheckpoint,
  listConnections,
  listAccessPoints,
  deleteConnection,
  updateConnection,
  connect,
  activate
} from "../api";
import copy from "../copy";

type AccessPointMap = { [key: string]: AccessPoint };

interface MyNetwork {
  connection: Connection;
  accessPoint: AccessPoint;
}

@Component({
  components: {
    WLANSettings
  }
})
export default class WLAN extends Vue {
  @Prop({ default: null }) readonly active!: Connection | null;
  @Prop({ default: false }) readonly visible!: boolean;

  loading: boolean = true;
  activating: Connection | null = null;
  connections: Connection[] = [];
  accessPoints: AccessPoint[] = [];
  accessPointsLoading: boolean = false;
  connecting: string | null = null;
  scanTimer: number = -1;

  passwordDialog: AccessPoint | null = null;
  connectPassword: string = "";
  showConnectPassword: boolean = true;
  editConnection: Connection | null = null;
  processing: Connection | null = null;

  get myNetworks(): MyNetwork[] {
    const visibleNetworks: AccessPointMap = this.accessPoints.reduce(
      (map: AccessPointMap, accessPoint) => {
        map[accessPoint.ssid] = accessPoint;
        return map;
      },
      {}
    );

    return this.connections
      .filter(
        connection =>
          this.isActive(connection) || connection.ssid in visibleNetworks
      )
      .sort((a, b) => Number(a.priority > b.priority))
      .map(connection => {
        return {
          connection,
          accessPoint: visibleNetworks[connection.ssid]
        };
      });
  }

  get isEditing(): boolean {
    return this.editConnection !== null;
  }

  get isProcessing(): boolean {
    return this.processing !== null;
  }

  async created() {
    // Scan wireless networks every 20s
    this.loadAccessPoints();
    this.scanTimer = setInterval(() => this.loadAccessPoints(), 20000);

    this.connections = await listConnections();
    this.loading = false;
  }

  beforeDestroy() {
    clearInterval(this.scanTimer);
  }

  async loadAccessPoints() {
    // Only update if visible
    if (!this.visible) {
      return;
    }
    // We are already loading access points
    if (this.accessPointsLoading) {
      return;
    }
    // We are trying to activate a connection
    if (this.activating) {
      return;
    }
    // We are trying to connect to a new network
    if (this.connecting) {
      return;
    }

    this.accessPointsLoading = true;
    try {
      this.accessPoints = await listAccessPoints();
    } finally {
      this.accessPointsLoading = false;
    }
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
      case "infrastructure":
        return "mdi-wifi";
      case "ad-hoc":
        return "mdi-access-point";
      default:
        return "";
    }
  }

  get otherNetworks(): AccessPoint[] {
    const knownSSIDs = this.connections.map(connection => connection.ssid);
    const signalThreshold = 25;

    return this.accessPoints
      .filter(accessPoint => !knownSSIDs.includes(accessPoint.ssid))
      .filter(accessPoint => accessPoint.strength >= signalThreshold)
      .sort((a, b) => Number(a.strength < b.strength));
  }

  isActive(connection: Connection) {
    if (!this.active) {
      return false;
    }
    return connection.id === this.active.id;
  }

  isActivating(connection: Connection) {
    if (!this.activating) {
      return false;
    }
    return connection.id == this.activating.id;
  }

  edit(connection: Connection) {
    this.editConnection = copy(connection);
  }

  isConnecting(accessPoint: AccessPoint) {
    if (!this.connecting) {
      return false;
    }
    return accessPoint.ssid == this.connecting;
  }

  connect(accessPoint: AccessPoint) {
    if (accessPoint.rsn) {
      if (this.connectPassword) {
        this.doConnect(accessPoint.ssid, this.connectPassword);
        this.closePasswordDialog();
      } else {
        this.passwordDialog = accessPoint;
      }
    } else {
      this.doConnect(accessPoint.ssid, null);
    }
  }

  closePasswordDialog() {
    this.connectPassword = "";
    this.showConnectPassword = false;
    this.passwordDialog = null;
  }

  close() {
    // Clicks outside the dialog trigger "close" action. Prevent closing if
    // some action is in progress.
    if (this.isProcessing) {
      return;
    }
    this.editConnection = null;
  }

  async deleteConnection(
    connection: Connection,
    resolve: () => void,
    reject: (reason: any) => void
  ) {
    if (this.processing) {
      return;
    }
    this.processing = connection;
    try {
      await deleteConnection(connection.id);
    } catch (err) {
      console.error(err);
      this.processing = null;
      return;
    }
    await this.reloadConnections();

    this.editConnection = null;
    this.processing = null;
  }

  async updateConnection(
    connection: Connection,
    resolve: () => void,
    reject: (reason: any) => void
  ) {
    if (this.processing) {
      return;
    }
    this.processing = connection;
    try {
      await updateConnection(connection);
    } catch (err) {
      reject(err);

      this.processing = null;
      return;
    }

    try {
      await this.reloadConnections();
      resolve();
      this.editConnection = null;
    } finally {
      this.processing = null;
    }
  }

  async reloadConnections() {
    this.connections = await listConnections();
  }

  async activate(connection: Connection) {
    if (this.activating) {
      return;
    }
    // Do not activate already active connections
    if (this.active && this.active.id == connection.id) {
      return;
    }
    this.activating = connection;

    try {
      // await new Promise(resolve => setTimeout(resolve, 3000));
      await withCheckpoint(() => activate({ type: "wifi", id: connection.id }));
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to activate connection"
      });
    } finally {
      await this.reloadConnections();
      await new Promise(resolve => this.$emit("reload", resolve));
      this.activating = null;
    }
  }

  async doConnect(ssid: string, password: string | null) {
    if (this.connecting) {
      return;
    }
    this.connecting = ssid;
    try {
      // await new Promise(resolve => setTimeout(resolve, 3000));
      await withCheckpoint(() => connect({ ssid, password }));
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to connect"
      });
    } finally {
      await this.reloadConnections();
      await new Promise(resolve => this.$emit("reload", resolve));
      this.connecting = null;
    }
  }
}
</script>
