const { Types, InternalActions } = require("../utils/types");

async function main() {



	process.send({
		type: Types.Internal,
		action: InternalActions.Start
	});

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
