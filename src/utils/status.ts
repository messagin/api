export const StatusCodes = {
  200: {
    Ok: 20000,
  },
  201: {
    UserCreated: 20100,
    ChatCreated: 20101,
    SpaceCreated: 20102,
    MessageCreated: 20103,
    RoleCreated: 20104,
    InviteCreated: 20105,
    MemberCreated: 20106,
    RelationCreated: 20107,
  },
  202: {
    UserDeletionPending: 20200,
  },
  204: {
    Deleted: 20400,
    Updated: 20401,
    NoContent: 20402,
  },
  400: {
    InvalidBody: 40000,
    UnknownTokenType: 40001,
    MalformedId: 40002,
    WrongPassword: 40003,
    TempUser: 40004,
  },
  401: {
    MissingToken: 40100,
    InvalidToken: 40101,
    MalformedToken: 40102,
    InvalidCredentials: 40103,
  },
  403: {
    WrongTokenType: 40300,
    TempUserPassword: 40301,
    NotOwner: 40302,
    Forbidden: 40303,
    NotABot: 40304,
  },
  404: {
    NotFound: 40400,
  },
  409: {
    EmailExists: 40900,
    ExistingMember: 40901,
    UsernameExists: 40902,
  },
  413: {
    PayloadTooLarge: 41300,
  },
  429: {
    RateLimited: 42900,
  },
  500: {
    InternalError: 50000,
    MissingIp: 50001,
  }
} as const;

export type StatusCode = keyof typeof StatusCodes;

export type StatusCodeMessage<T extends StatusCode = StatusCode> = {
  [K in T]: keyof typeof StatusCodes[K];
}[T];

export type ExtendedStatusCodes = {
  [K in StatusCode]: (typeof StatusCodes[K])[StatusCodeMessage<K>]
}[StatusCode];

export const StatusMessages = Object.freeze({
  //#region 200 OK
  20000: "Success",
  //#endregion
  //#region 201 Created
  20100: "User created",
  20101: "Chat created",
  20102: "Space created",
  20103: "Message created",
  20104: "Role created",
  20105: "Invite created",
  20106: "Space joined",
  20107: "Relation created",
  //#endregion
  //#region 202 Accepted
  20200: "User deletion pending",
  //#endregion
  //#region 204 No Content
  20400: "",
  20401: "",
  20402: "",
  //#endregion
  //#region 400 Bad Request
  40000: "The request body is invalid",
  40001: "The provided token type is unknown",
  40002: "The provided ID is malformed",
  40003: "Invalid password provided",
  //#endregion
  //#region 401 Unauthorized
  40100: "Authentication token is missing",
  40101: "Authentication token is invalid",
  40102: "Authentication token is malformed",
  40103: "Invalid email or password",
  //#endregion
  //#region 403 Forbidden
  40300: "Incorrect token type provided",
  40301: "Cannot change the password of a temporary user",
  40302: "Only the space owner can perform this action",
  40303: "You do not have permission to access this resource",
  40304: "This action can only be performed as a bot",
  //#endregion
  //#region 404 Not Found
  40400: "The requested resource was not found",
  //#endregion
  //#region 409 Conflict
  40900: "An user with that email already exists",
  40901: "You are already a member of this space",
  40902: "An user with that username already exists",
  //#endregion
  //#region 413 Payload Too Large
  41300: "The request payload is too large",
  //#endregion
  //#region 429 Too Many Requests
  42900: "You are being rate limited",
  //#endregion
  //#region 500 Internal Server Error
  50000: "An internal error occurred",
  50001: "Client IP address is missing or undefined"
  //#endregion
} as { [K in ExtendedStatusCodes]: string });
