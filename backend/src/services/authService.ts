import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = "7d";

export async function hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(plainPassword, saltRounds);
}

export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
}

export function generateToken(userId: number, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: number; email: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
}