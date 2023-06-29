const Types = {
	Internal: 0,
	Stdio: 1,
	Route: 2,
	Event: 3
};

const RouteActions = {
	Register: 0,
	Activate: 1,
	Deactivate: 2,
	ExchangeId: 3
};

const InternalActions = {
	Start: 0,
	Exit: 1
};

Object.freeze(Types);
Object.freeze(RouteActions);
Object.freeze(InternalActions);

module.exports = { Types, RouteActions, InternalActions };
