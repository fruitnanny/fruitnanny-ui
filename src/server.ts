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

      this.get("/active-connection", schema => {
        // return schema.db.hotspots.firstOrCreate({});
        return schema.db.connections.firstOrCreate({});
        // return new Response(404, undefined, "Not connected");
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

      let checkpoint = false;
      this.get("/checkpoint", () => {
        checkpoint = !checkpoint;
        if (checkpoint) {
          return new Response(410);
        } else {
          const now = new Date();
          const created = new Date(now.getTime() - 25 * 1000);
          return {
            id: 26,
            created: created.toISOString(),
            rollbackTimeout: 30
          };
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
