import crypto from 'crypto';

/**
 * Generate a random token
 * @param length Length of the token (default: 32)
 * @returns Random hex string
 */
export const generateToken = (length: number = 32): string => {
    return crypto.randomBytes(length / 2).toString('hex');
};

/**
 * Generate a numeric code (e.g., for 2FA or short URLs)
 * @param length Length of the code (default: 6)
 * @returns Random numeric string
 */
export const generateNumericCode = (length: number = 6): string => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};
