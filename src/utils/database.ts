import { Client } from "cassandra-driver";

const db = new Client({
  contactPoints: ["192.168.0.127", "127.0.0.1"],
  keyspace: "messagin",
  localDataCenter: "datacenter1"
});

export default db;
