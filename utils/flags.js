const UserFlags = {
	Administrator: 1 << 0,
	MfaEnabled: 1 << 1,
	Bot: 1 << 2
}

const PermissionFlags = {

}

Object.freeze(UserFlags);
Object.freeze(PermissionFlags);

module.exports = { UserFlags, PermissionFlags };
