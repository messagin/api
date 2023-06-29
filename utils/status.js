const StatusCodes = {
	401: {
		MissingToken: 40101,
		InvalidToken: 40102,
		MalformedToken: 40103
	},
	500: {
		InternalError: 50001
	}
}

const StatusMessages = {
	//#region 401
	40101: "Unauthorized: Missing authentication token",
	40102: "Unauthorized: Invalid authentication token",
	40103: "Unauthorized: Malformed authentication token",
	//#endregion
	//#region 500
	50001: "An internal error happened. Please try again later"
	//#endregion
}

Object.freeze(StatusCodes);

module.exports = { StatusCodes, StatusMessages };
