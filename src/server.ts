import { Factory, Model, Server, RestSerializer, Response } from "miragejs";
import faker from "faker";

export function makeServer(): Server {
  return new Server({
    models: {
      connection: Model,
      hotspot: Model,
      accessPoint: Model
    },

    factories: {
      connection: Factory.extend({
        type: "wifi",
        id(): string {
          return faker.random.uuid();
        },
        name(): string {
          return faker.address.city();
        },
        ssid(): string {
          // @ts-ignore
          return this.name;
        },
        // password(): string {
        //   return faker.internet.password();
        // },
        autoconnect: true,
        priority: 0
      }),
      accessPoint: Factory.extend({
        ssid(): string {
          return faker.address.city();
        },
        strength(): number {
          return 100 * faker.random.number();
        },
        mode: "infrastructure",
        rsn: true
      }),
      hotspot: Factory.extend({
        type: "hotspot",
        password(): string {
          return faker.internet.password();
        },
        ssid: "FruitNanny Hotspot"
      })
    },

    routes() {
      this.namespace = "api";

      this.get("/", () => {
        return { version: "20.05.7" };
      });

      let activeConnection: string = "hotspot";
      // let activeConnection: string = "wifi";
      // let activeConnection: string = "disconnected";
      this.get("/active-connection", schema => {
        switch (activeConnection) {
          case "hotspot":
            return schema.db.hotspots.firstOrCreate({});
          case "wifi":
            return schema.db.connections.firstOrCreate({});
          case "disconnected":
            return new Response(404, undefined, "Not connected");
          default:
            return schema.db.connections.find(activeConnection);
        }
      });
      this.put("/active-connection", (schema, request) => {
        let attrs = JSON.parse(request.requestBody);
        if (attrs.type === "hotspot") {
          activeConnection = "hotspot";
          return schema.db.hotspots.firstOrCreate({});
        } else {
          activeConnection = "wifi";
          return schema.db.connections.findBy({ id: attrs.id });
        }
      });
      this.post("/active-connection", (schema, request) => {
        let attrs = JSON.parse(request.requestBody);
        let connection = schema.db.connections.insert({
          id: faker.random.uuid(),
          ssid: attrs.ssid,
          name: attrs.ssid,
          priority: 0,
          autoconnect: true
        });
        activeConnection = connection.id;
        return connection;
      });
      this.delete("/active-connection", () => {
        activeConnection = "disconnected";
        return new Response(200);
      });

      this.get("/connections", schema => {
        return schema.db.connections;
      });
      this.get("/connections/:id");
      this.post("/connections");
      this.put("/connections/:id", (schema, request) => {
        let attrs = JSON.parse(request.requestBody);
        let connection = schema.db.connections.update(request.params.id, {
          name: attrs.name,
          ssid: attrs.ssid,
          password: attrs.password,
          autoconnect: attrs.autoconnect,
          priority: attrs.priority
        });
        return connection;
      });
      this.del("/connections/:id");

      this.get("/access-points", schema => {
        return schema.db.accessPoints;
      });

      this.get("/hotspot", schema => {
        return schema.db.hotspots.firstOrCreate({});
      });
      this.put("/hotspot");

      this.get("/settings", () => {
        return {
          temperatureOffset: -3.4,
          humidityOffset: -10
        };
      });

      let light = false;
      this.get("/light", () => {
        return {
          state: light
        };
      });

      this.put("/light", (schema, request) => {
        let attrs = JSON.parse(request.requestBody);
        light = attrs.state;
        return {
          state: light
        };
      });

      this.get("/sensors", () => {
        return {
          humidity: 43.2,
          temperature: 25.1
        };
      });

      this.get("/connectivity", () => {
        return {
          connectivity: "full"
        };
      });

      this.get("/updates", (schema, request) => {
        if (request.queryParams.download) {
          return {
            "fruitnanny-api": "recent",
            "fruitnanny-ui": "available",
            wpasupplicant: "available",
            rws: "recent"
          };
        } else {
          return {
            "fruitnanny-api": "recent",
            "fruitnanny-ui": "recent",
            wpasupplicant: "recent",
            rws: "recent"
          };
        }
      });

      let checkpoint: any = null;
      // const now = new Date();
      // const created = new Date(now.getTime() - 25 * 1000);
      // let checkpoint: any = {
      //   id: 26,
      //   created: created.toISOString(),
      //   rollbackTimeout: 60
      // };
      this.get("/checkpoint", () => {
        if (!checkpoint) {
          return new Response(410);
        } else {
          return checkpoint;
        }
      });
      this.put("/checkpoint", (schema, request) => {
        if (checkpoint) {
          return new Response(409);
        } else {
          let attrs = JSON.parse(request.requestBody);
          const now = new Date();
          checkpoint = {
            id: 26,
            created: now.toISOString(),
            rollbackTimeout: attrs.rollbackTimeout
          };
          return checkpoint;
        }
      });
      this.delete("/checkpoint", () => {
        if (!checkpoint) {
          return new Response(410);
        } else {
          checkpoint = null;
          return new Response(200);
        }
      });
    },

    seeds(server) {
      server.createList("connection", 5);
      server.create("hotspot");
      server.createList("access-point", 3);
    }
  });
}
