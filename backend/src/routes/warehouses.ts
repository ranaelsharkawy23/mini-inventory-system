import { Router } from "express";
import { prisma } from "../db";
import { badRequest } from "../errors";

export const warehousesRouter = Router();

// GET /api/warehouses
warehousesRouter.get("/", async (_req, res, next) => {
    try {
        const warehouses = await prisma.warehouse.findMany({ orderBy: { id: "asc" } });
        res.json(warehouses);
    } catch (err) {
        next(err);
    }
});

// POST /api/warehouses  { name, location? }
warehousesRouter.post("/", async (req, res, next) => {
    try {
        const { name, location } = req.body ?? {};
        if (typeof name !== "string" || !name.trim()) throw badRequest("name is required");

        const warehouse = await prisma.warehouse.create({
            data: { name: name.trim(), location: location?.trim() || null },
        });
        res.status(201).json(warehouse);
    } catch (err) {
        next(err);
    }
});