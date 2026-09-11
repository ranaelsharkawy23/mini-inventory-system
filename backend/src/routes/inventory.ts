import { Router } from "express";
import { badRequest } from "../errors";
import { addStock, removeStock, transferStock } from "../services/inventoryService";

export const inventoryRouter = Router();

function parseIds(body: unknown, fields: string[]): Record<string, number> {
    const b = (body ?? {}) as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const field of fields) {
        const value = Number(b[field]);
        if (!Number.isInteger(value)) throw badRequest(`${field} must be an integer`);
        result[field] = value;
    }
    return result;
}

// POST /api/inventory/add  { productId, warehouseId, quantity }
inventoryRouter.post("/add", async (req, res, next) => {
    try {
        const { productId, warehouseId, quantity } = parseIds(req.body, [
            "productId",
            "warehouseId",
            "quantity",
        ]);
        const item = await addStock(productId, warehouseId, quantity);
        res.json(item);
    } catch (err) {
        next(err);
    }
});

// POST /api/inventory/remove  { productId, warehouseId, quantity }
inventoryRouter.post("/remove", async (req, res, next) => {
    try {
        const { productId, warehouseId, quantity } = parseIds(req.body, [
            "productId",
            "warehouseId",
            "quantity",
        ]);
        const item = await removeStock(productId, warehouseId, quantity);
        res.json(item);
    } catch (err) {
        next(err);
    }
});

// POST /api/inventory/transfer  { productId, fromWarehouseId, toWarehouseId, quantity }
inventoryRouter.post("/transfer", async (req, res, next) => {
    try {
        const { productId, fromWarehouseId, toWarehouseId, quantity } = parseIds(req.body, [
            "productId",
            "fromWarehouseId",
            "toWarehouseId",
            "quantity",
        ]);
        const result = await transferStock(productId, fromWarehouseId, toWarehouseId, quantity);
        res.json(result);
    } catch (err) {
        next(err);
    }
});