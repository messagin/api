const StatusCodes = {
	200: {
		Ok: 20000
	},
	400: {
		MalformedId: 40000
	},
	401: {
		MissingToken: 40100,
		InvalidToken: 40101,
		MalformedToken: 40102
	},
	404: {
		NotFound: 40400
	},
	500: {
		InternalError: 50000
	}
}

const StatusMessages = {
	//#region 200
	20000: "OK",
	//#endregion
	//#region 400
	40000: "You provided a malformed ID",
	//#endregion
	//#region 401
	40100: "Missing authentication token",
	40101: "Invalid authentication token",
	40102: "Malformed authentication token",
	//#endregion
	//#region 404
	40400: "Requested resource not found",
	//#endregion
	//#region 500
	50000: "An internal error occurred. Please try again later"
	//#endregion
}

Object.freeze(StatusCodes);
Object.freeze(StatusMessages);

module.exports = { StatusCodes, StatusMessages };
