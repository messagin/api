/**
 * Generates a cryptographically strong random base64 token
 */
export function generateRandToken(length: number): string;

/**
 * Generates a token given an ID
 */
export function generateToken(id: string): {
	/**
	 * the raw token
	 */
	key: string,
	/**
	 * base64 encoded id + token
	 */
	string: string,
	/**
	 * the hashed token
	 */
	hash: string
};

/**
 * Creates a Hmac object using the sha512 algorithm and returns a base64 representation (86 chars)
 */
export function generateHmac(data: string, salt: string): string;

/**
 * Creates a Hash object using the sha512 algorithm and returns a base64 representation (86 chars)
 */
export function generateHash(data: string): string;

/**
 * Generates a base 10 code
 */
export function generateCode(length: number): string;

/**
 * Generates a TOTP token given the secret
 */
export function generateTOTP(secret: string): string;

/**
 * Generates a base 32 random seed to create TOTP
 */
export function generate2FA(length: number): string;

/**
 * @deprecated
 * Creates an ID using the THREAD_ID environment variable and the current system time
 */
export function generateID(): string;

/**
 * Creates a 80 bit ID using MACHINE_ID, THREAD_ID and the current system time
 */
export function generateIDv2(): string;

/**
 * Creates a 80 bit ID from a 64 bit ID
 */
export function convertID(id: string): string;

/**
 * Creates a 80 bit ID from a Discord Snowflake ID
 */
export function convertDiscordID(id: string): string;

/**
 * Extracts a timestamp from an ID
 */
export function getTimestamp(id: string): number;

/**
 * Encrypts data using given a key and an IV
 * @param {string} key hex representation of the key
 * @param {string} iv hex representation of the initialization vector
 * @param {string} data data to encrypt
 */
export function encrypt(key: string, iv: string, data: string): string;

/**
 * Decrypts data using given a key and an IV
 * @param {string} key hex representation of the key
 * @param {string} iv hex representation of the initialization vector
 * @param {string} data data to decrypt
 */
export function decrypt(key: string, iv: string, data: string): string;

//! integrated part

export function parseToken(token: string): {
	id: string,
	key: string,
	hash: string
}
export async function authenticated(req: Express.Request): Promise<boolean>;
