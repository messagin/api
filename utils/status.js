const StatusCodes = {
	200: {
		Ok: 20000
	},
	201: {
		UserCreated: 20100,
		ChatCreated: 20101
	},
	202: {
		UserDeletionPending: 20200
	},
	204: 20400,
	400: {
		InvalidBody: 40000,
		UnknownTokenType: 40001,
		MalformedId: 40002,
		WrongPassword: 40003
	},
	401: {
		MissingToken: 40100,
		InvalidToken: 40101,
		MalformedToken: 40102,
		InvalidCredentials: 40103
	},
	403: {
		WrongTokenType: 40300,
		TempUserPassword: 40301
	},
	404: {
		NotFound: 40400
	},
	409: {
		EmailExists: 40900
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
	//#region 201
	20100: "User created",
	20101: "Chat created",
	//#endregion
	//#region 202
	20200: "User deletion pending",
	//#endregion
	//#region 202
	20400: "", // this is a placeholder to avoid errors
	//#endregion
	//#region 400
	40000: "The request body is invalid", // fixme
	40001: "The provided token type is unknown",
	40002: "The provided ID is malformed",
	40003: "Invalid password provided",
	//#endregion
	//#region 401
	40100: "Authentication token is missing",
	40101: "Authentication token is invalid",
	40102: "Authentication token is malformed",
	40103: "Invalid email or password",
	//#endregion
	//#region 403
	40300: "Incorrect token type provided",
	40301: "Cannot change the password of a temporary user",
	//#endregion
	//#region 404
	40400: "The requested resource was not found",
	//#endregion
	//#region 404
	40900: "An user with that email already exists",
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
