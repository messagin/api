const StatusCodes = {
	200: {
		Ok: 20000
	},
	400: {
		MalformedId: 40000,
		UnknownTokenType: 40001
	},
	401: {
		MissingToken: 40100,
		InvalidToken: 40101,
		MalformedToken: 40102
	},
	403: {
		WrongTokenType: 40300
	},
	404: {
		NotFound: 40400
	},
	429: {
		RateLimited: 42900
	},
	500: {
		InternalError: 50000,
		MissingIp: 50001
	}
}

const StatusMessages = {
	//#region 200
	20000: "Success",
	//#endregion
	//#region 400
	40000: "The provided ID is malformed",
	40001: "The provided token type is unknown",
	//#endregion
	//#region 401
	40100: "Authentication token is missing",
	40101: "Authentication token is invalid",
	40102: "Authentication token is malformed",
	//#endregion
	//#region 403
	40300: "Incorrect token type provided",
	//#endregion
	//#region 404
	40400: "The requested resource was not found",
	//#endregion
	//#region 429
	42900: "You are being rate limited",
	//#endregion
	//#region 500
	50000: "An internal error occurred. Please try again later",
	50001: "Client IP address is missing or undefined"
	//#endregion
}

Object.freeze(StatusCodes);
Object.freeze(StatusMessages);

module.exports = { StatusCodes, StatusMessages };
