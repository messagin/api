import { log } from "../utils/log";
import express from "express";
import helmet from "helmet";
import cookies from "cookie-parser";
import { IPCMessage } from "../utils/IPCMessage";
import { Types, InternalActions } from "../utils/actions";
import { createServer } from "http";
import expressWs from "express-ws";
import router from "../routes/index";

// import public_router from "./routes/public";

// const { respond } = require("../util/respond");

const app = express();
const server = createServer(app);

expressWs(app, server);

// listen on *:4000
server.listen(4000, () => process.send?.({
  type: Types.Internal,
  action: InternalActions.Start
}));

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
// remove the X-Powered-By header from responses
app.use(helmet.hidePoweredBy());

// mount routes
// app.use("/auth", require("./routes/auth"));
// app.use("/assets", express.static("assets"));
// app.use("/api", require("../routes/api"));

// use cookie parsing middleware
app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);
// app.use("/", require("../routes/public"));

// handle 404 for all methods
// app.all("/*", (_req, res) => respond(res, 404));

// print errors without exiting
process.on("uncaughtException", (err) => {
  log("red", "global")(err.stack ?? "");
});

// listen for keypresses and send them to primary process
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.setRawMode(true);
process.stdin.on("data", (data) => {
  process.send?.({ type: Types.Stdio, data });
});

process.on("message", (msg: IPCMessage) => {
  if (msg.type === Types.Internal) {
    if (msg.action === InternalActions.Exit) {
      process.disconnect();
      process.exit();
    }
  }
});
