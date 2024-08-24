import { inspect } from "util";
import { log } from "./utils/log";
import { Cluster } from "./cluster/Cluster";
import { cpus } from "os";
import { initDatabase } from "./utils/database";

const CPUs = cpus().length;

async function main() {

  log("blue")(`Primary is running`);
  await initDatabase();

  const cluster = new Cluster(CPUs);

  cluster.setup({
    exec: __dirname + "/cluster/worker.js",
    serialization: "advanced" // send buffers instead of plaintext
  });

  // create a worker for each CPU core
  for (let i = 0; i < CPUs; i++) await cluster.fork();

  if (process.stdin.isTTY) {
    // Start reading input from the console and listen to key events
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.on("data", (data: string) => {
      cluster.handleInput(data);
    });
  }
}

process.on("unhandledRejection", err => {
  process.stdout.write("Some error happened\n");
  process.stderr.write(inspect(err));
});

// enter the program
main();
