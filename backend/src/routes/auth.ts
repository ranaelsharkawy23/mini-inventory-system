import { Router } from "express";
import { prisma } from "../db";
import { badRequest } from "../errors";
import { generateToken, hashPassword, verifyPassword } from "../services/authService";

export const authRouter = Router();

// POST /api/auth/register  { email, password }
authRouter.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};
        if (typeof email !== "string" || !email.trim()) throw badRequest("email is required");
        if (typeof password !== "string" || password.length < 8) {
            throw badRequest("password must be at least 8 characters");
        }

        const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
        if (existing) throw badRequest("An account with this email already exists");

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: { email: email.trim(), passwordHash },
        });

        const token = generateToken(user.id, user.email);
        res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login  { email, password }
authRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};
        if (typeof email !== "string" || typeof password !== "string") {
            throw badRequest("email and password are required");
        }

        const user = await prisma.user.findUnique({ where: { email: email.trim() } });
        // Deliberately vague error: don't reveal whether the email exists or the
        // password was wrong — both cases return the exact same message.
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            throw badRequest("Invalid email or password");
        }

        const token = generateToken(user.id, user.email);
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        next(err);
    }
});