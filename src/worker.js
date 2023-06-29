const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const expressWs = require("express-ws");
const cors = require("cors");
const { createServer } = require("node:http");
const { log } = require("../utils/log");
const { Types, InternalActions } = require("../utils/types");

const app = express();
const server = createServer(app);
const ws = expressWs(app, server);

async function main() {

	server.listen(process.env.PORT | 8000, () => process.send({
		type: Types.Internal,
		action: InternalActions.Start
	}));

	app.use(cors());
	app.use(cookieParser());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use("/v1", require("../routes/v1"));

	process.stdin.resume();
	process.stdin.setEncoding("utf8");
	process.stdin.setRawMode(true);
	process.stdin.on("data", (data) => {
		process.send({ type: Types.Stdio, data });
	});

	process.on("message", msg => {
		if (msg.type == Types.Internal) {
			if (msg.action == InternalActions.Exit) {
				process.disconnect();
				process.exit();
			}
		}
	});

}

main();
