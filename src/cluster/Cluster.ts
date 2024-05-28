import * as clusterModule from "cluster";
// import * as clusterModule from "cluster";
import { log } from "../utils/log";
import IdManager from "./IdManager";
import { Types, RouteActions, InternalActions } from "../utils/actions";
import { IPCMessage } from "../utils/IPCMessage";

const cluster = clusterModule.default ?? clusterModule;

export class Cluster {
  private workers: Map<number, clusterModule.Worker>;
  private idmanager: IdManager;
  private deadWorkers: number[];
  private CPUs: number;

  constructor(CPUs: number) {
    this.CPUs = CPUs;
    this.workers = new Map();
    this.idmanager = new IdManager();
    // initialize to [0,1,2,...] as workers are not started
    this.deadWorkers = [...Array(CPUs).keys()];
  }

  // reuse IDs
  private getNextWorkerId(): number {
    return this.deadWorkers.shift() ?? 0;
  }

  async reload(id: number) {
    await this.destroy(id);
    await this.fork(id);
  }

  handleExit(id: number) {
    if (!this.workers.has(id)) return;
    this.workers.delete(id);
    this.deadWorkers.push(id);
  }

  handleRouteMessage(msg: IPCMessage, worker: clusterModule.Worker) {
    if (msg.action === RouteActions.Register) {
      log("yellow")(`Registering route ${msg.route}`);
      worker.send({
        type: Types.Route,
        action: RouteActions.ExchangeId,
        route: msg.route,
        id: this.idmanager.generate()
      });
    }
    if (msg.action === RouteActions.Activate) {
      return;
    }
    if (msg.action === RouteActions.Deactivate) {
      return;
    }
    if (msg.action === RouteActions.ExchangeId)
      this.idmanager.revoke(msg.id);
  }


  handleInternalMessage(msg: IPCMessage, worker: clusterModule.Worker, workerId: number, resolve: (worker: clusterModule.Worker) => void) {
    if (msg.action === InternalActions.Start) {
      this.workers.set(workerId, worker);
      log("brightBlue")(`Worker #${workerId} started`);
      resolve(worker);
    }
  }

  async destroy(id: number): Promise<void> {
    const worker = this.workers.get(id);
    if (!worker) throw new Error(`Worker with id ${id} not found`);
    return new Promise(resolve => {
      worker.on('exit', () => {
        log("red")(`Worker #${id} stopped`);
        this.deadWorkers.push(id);
        this.workers.delete(id);
        resolve();
      });
      worker.send({
        type: Types.Internal,
        action: InternalActions.Exit
      });
    });
  }


  async handleInput(data: string) {
    // clear console if ^C is pressed
    if (data === "\x03") return log.clear();
    // exit if ^D is pressed
    if (data === "\x04") return await this.exit();
    // reload workers when ^R is pressed
    if (data === "\x12") {
      log.title("brightYellow", "Restarting workers...");
      for (let i = 0; i < this.CPUs; i++) await this.reload(i).catch(log("red"));
      log.end();
      return;
    }
    // log worker count when ^S is pressed
    if (data === "\x13")
      log("brightGreen")(this.workers.size + " workers up");
  }

  fork(id = this.getNextWorkerId()): Promise<clusterModule.Worker> {
    return new Promise(resolve => {
      const worker = cluster.fork({ THREAD_ID: id, MACHINE_ID: 0 });

      // free worker id on exit
      worker.on('exit', code => {
        if (code === 1) {
          log.title("brightRed", "Fatal Error, exiting...");
          this.exit();
        } else this.handleExit(id);
      });
      worker.on('message', msg => {
        if (msg.type === Types.Internal)
          return this.handleInternalMessage(msg, worker, id, resolve);
        if (msg.type === Types.Stdio) return this.handleInput(msg.data);
        if (msg.type === Types.Route) return this.handleRouteMessage(msg, worker);
        if (msg.type === Types.Event)
          this.workers.forEach(w => w.send(msg));
      });

    });
  }

  async exit() {
    for (const [index] of this.workers) await this.destroy(index);
    process.exit();
  }

  setup(settings: clusterModule.ClusterSettings) {
    cluster.setupPrimary(settings);
  }
}
