import { log } from "../utils/log";
import express from "express";
import helmet from "helmet";
import cookies from "cookie-parser";
import { IPCMessage } from "../utils/IPCMessage";
import { Types, InternalActions } from "../utils/actions";
import { createServer } from "http";
import expressWs from "express-ws";
import router from "../routes/index";
import { respond } from "../utils/respond";
import cors from "cors";

// import public_router from "./routes/public";

// const { respond } = require("../util/respond");

const app = express();
const server = createServer(app);

expressWs(app, server);

// listen on *:4000
server.listen(process.env.PORT || 4000, () => process.send?.({
  type: Types.Internal,
  action: InternalActions.Start
}));

app.use(cors());

app.use(helmet({
  hidePoweredBy: true
}));

app.use((req, res, next) => {
  const request_size = Number(req.headers["content-length"] ?? 0);
  if (request_size > 0x10000) { // 64 KiB
    return respond(res, 413, "PayloadTooLarge");
  }
  res.locals.ip = req.headers["cf-connecting-ip"] ?? req.headers["x-real-ip"] ?? req.headers["x-forwarded-for"] ?? req.ip;
  if (!res.locals.ip) {
    log("red")("Error: IP address is undefined");
    return respond(res, 500, "MissingIp");
  }
  res.locals.country = req.headers["cf-ipcountry"];
  return next();
});

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
  log("red", "\x1b[91;1mGLOBAL\x1b[0m")(err.stack ?? "");
});

if (process.stdin.isTTY) {
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
}
else {
  log("white")("Running in a non-interactive environment, skipping raw mode setup.");
}
