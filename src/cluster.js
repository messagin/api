const { randomBytes } = require("node:crypto");
const { Types, InternalActions } = require("../utils/types");
const cluster = require("node:cluster");
const { log } = require("../utils/log");

// Class responsible for generating and managing unique IDs
class IdManager {
	constructor() {
		this.ids = new Set(); // Set to store generated IDs
	}

	// Generate a unique ID
	generate() {
		let id = randomBytes(12).toString("base64url"); // Generate a random ID
		if (this.ids.has(id)) return this.generate(); // If the ID already exists, generate a new one recursively
		this.ids.add(id); // Add the generated ID to the set
		return id;
	}

	// Revoke (remove) a specific ID
	revoke(id) {
		this.ids.delete(id); // Delete the ID from the set
	}
}

// Custom Cluster class
class Cluster {
	CPUs; // Number of available CPUs
	workers; // Map to store worker instances
	idManager; // Instance of IdManager to manage worker IDs
	deadWorkers; // Array to keep track of available (unused) worker IDs

	constructor(CPUs) {
		this.CPUs = CPUs; // Set the number of CPUs
		this.workers = new Map(); // Initialize an empty map to store worker instances
		this.idManager = new IdManager(); // Create an instance of IdManager
		this.deadWorkers = Array.from({ length: CPUs }, (_, i) => i); // Initialize the deadWorkers array with [0, 1, 2, ...] representing available worker IDs
	}

	// Get the next available worker ID
	getNextWorkerId() {
		return this.deadWorkers.shift(); // Take the first worker ID from the array (FIFO) and remove it
	}

	// fixme catch errors
	async reload(id) {
		await this.destroy(id); // Destroy the worker with the given ID
		await this.fork(id); // Fork a new worker with the same ID
	}

	handleExit(id) {
		if (!this.workers.has(id)) return; // If the worker with the given ID doesn't exist, return
		this.workers.delete(id); // Delete the worker with the given ID from the workers map
		this.deadWorkers.push(id); // Add the ID to the deadWorkers array for reuse
	}

	handleInternalMessage(msg, worker, worker_id, resolve) {
		if (msg.action == InternalActions.Start) {
			this.workers?.set(worker_id, worker);
			log("blue")(`Worker #${worker_id} started`);
			resolve(worker);
		}
		if (msg.action == InternalActions.MemUsage)
			memUsage[worker_id] = msg.data;
	}

	async handleInput(data) {
		// exit if ^C is pressed
		if (data == "\x03") return await this.exit();
		// reload workers when ^R is pressed
		if (data == "\x12") {
			log.title("yellow", "Restarting workers...");
			for (let i = 0; i < this.CPUs; i++) await this.reload(i).catch(log("red"));
			log.end();
			return;
		}
		// log worker count when ^S is pressed
		if (data == "\x13")
			log("green")("${this.workers.size} workers up");
	}

	// fixme catch errors
	async destroy(id) {
		const worker = this.workers.get(id); // Get the worker with the given ID from the workers map
		if (!worker) throw new Error(`Worker with id ${id} not found`); // Throw an error if the worker doesn't exist
		return new Promise(resolve => {
			worker.on('exit', () => {
				log("red")(`Worker #${id} stopped`); // Log a message indicating that the worker with the given ID has stopped
				this.deadWorkers.push(id); // Add the ID to the deadWorkers array for reuse
				this.workers.delete(id); // Delete the worker with the given ID from the workers map
				resolve(); // Resolve the promise to indicate that the destruction is complete
			});
			worker.send({
				type: Types.Internal,
				action: InternalActions.Exit
			}); // Send a message to the worker instructing it to exit
		});
	}

	/**
	 * Forks a new worker with the specified id.
	 * @param {number} id - The id of the worker.
	 * @returns {Promise} A promise that resolves when the worker is forked.
	 */
	fork(id = this.getNextWorkerId()) {
		return new Promise(resolve => {
			const worker = cluster.fork({ THREAD_ID: id, MACHINE_ID: 0 });

			// Free worker id on exit
			worker.on('exit', code => {
				if (code == 1) {
					log.title("brightRed", "Fatal Error, exiting...");
					this.exit();
				} else {
					this.handleExit(id);
				}
			});

			worker.on('message', msg => {
				if (msg.type == Types.Internal) {
					return this.handleInternalMessage(msg, worker, id, resolve);
				}
				if (msg.type == Types.Stdio) {
					return this.handleInput(msg.data);
				}
				if (msg.type == Types.Route) {
					return this.handleRouteMessage(msg, worker);
				}
				if (msg.type == Types.Event) {
					workers?.forEach(w => w.send(msg));
				}
			});
		});
	}

	/**
	 * Exits the cluster and destroys all workers.
	 * @returns {Promise} A promise that resolves when all workers are destroyed.
	 */
	async exit() {
		for (const [index] of this.workers) {
			await this.destroy(index);
		}
		process.exit();
	}

	/**
	 * Sets up the primary cluster settings.
	 * @param {any} settings - The cluster settings.
	 */
	setup(settings) {
		cluster.setupPrimary(settings);
	}

}

module.exports = { Cluster };
