const { EventEmitter } = require("events");
const { Types } = require("./types");

let events = {
	userCreate: {
		id: "",
		username: "",
		flags: 0
	}, messageCreate: {
		id: "",
		chat_id: "",
		user_id: "",
		content: ""
	}, chatCreate: {
		id: "",
		name: ""
	}, chatDelete: {
		id: ""
	}, messageDelete: {
		chat_id: "",
		id: ""
	}
}

class Emitter extends EventEmitter {
	constructor() {
		super();
		process.on("message", this.onMessage);
	}
	onMessage = msg => {
		if (msg.type == Types.Event) this.emit(msg.name, msg.data);
	}
	/**
	 * @param {keyof events} eventName
	 * @param {events[eventName]} data
	 */
	customEmit = (eventName, data) => {
		process.send({
			type: Types.Event,
			name: eventName,
			data
		});
	}
	destroy = () => { process.off("message", this.onMessage); }
}

module.exports = { Emitter };
