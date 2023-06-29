const { Cluster } = require("./cluster");
const { log } = require("../utils/log");
const CPUs = require("node:os").cpus().length;

async function main() {

	log("cyan")("Primary is running");

	const cluster = new Cluster(CPUs);

	cluster.setup({
		exec: "src/worker.js", // file to be executed as worker
		serialization: "advanced" // send buffers instead of plaintext
	});

	// create a worker for each CPU core
	for (let i = 0; i < CPUs; i++) await cluster.fork();

	// Start reading input from the console and listen to key events
	process.stdin.resume();
	process.stdin.setEncoding("utf8");
	process.stdin.setRawMode(true);
	process.stdin.on("data", data => cluster.handleInput(data));

}

main();
