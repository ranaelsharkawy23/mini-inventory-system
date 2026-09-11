import { Router } from "express";
import { prisma } from "../db";
import { badRequest } from "../errors";

export const productsRouter = Router();

// GET /api/products
// Returns every product together with its per-warehouse inventory,
// which is exactly what the "expand a product" UI needs in one call.
productsRouter.get("/", async (_req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { id: "asc" },
            include: {
                inventoryItems: {
                    include: { warehouse: true },
                },
            },
        });
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// POST /api/products  { sku, name, description? }
productsRouter.post("/", async (req, res, next) => {
    try {
        const { sku, name, description } = req.body ?? {};
        if (typeof sku !== "string" || !sku.trim()) throw badRequest("sku is required");
        if (typeof name !== "string" || !name.trim()) throw badRequest("name is required");

        const product = await prisma.product.create({
            data: { sku: sku.trim(), name: name.trim(), description: description?.trim() || null },
        });
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
});