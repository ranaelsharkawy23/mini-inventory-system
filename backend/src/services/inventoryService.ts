import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { badRequest, notFound } from "../errors";

// Prisma's transaction client type — used so helper functions below can run
// either standalone or as part of a larger transaction.
type Tx = Prisma.TransactionClient;

function assertPositiveInt(quantity: number, field = "quantity") {
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw badRequest(`${field} must be a positive integer`);
    }
}

/**
 * Gets (or creates, at zero) the InventoryItem row for a product/warehouse pair.
 * Using upsert means callers never have to worry about "first stock ever added"
 * as a special case.
 */
async function getOrCreateInventoryItem(tx: Tx, productId: number, warehouseId: number) {
    const [product, warehouse] = await Promise.all([
        tx.product.findUnique({ where: { id: productId } }),
        tx.warehouse.findUnique({ where: { id: warehouseId } }),
    ]);
    if (!product) throw notFound(`Product ${productId} not found`);
    if (!warehouse) throw notFound(`Warehouse ${warehouseId} not found`);

    return tx.inventoryItem.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: {},
        create: { productId, warehouseId, quantity: 0 },
    });
}

export async function addStock(productId: number, warehouseId: number, quantity: number) {
    assertPositiveInt(quantity);

    return prisma.$transaction(async (tx) => {
        const item = await getOrCreateInventoryItem(tx, productId, warehouseId);

        const updated = await tx.inventoryItem.update({
            where: { id: item.id },
            data: { quantity: { increment: quantity } },
        });

        await tx.stockMovement.create({
            data: { type: MovementType.ADD, productId, warehouseId, quantity },
        });

        return updated;
    });
}

export async function removeStock(productId: number, warehouseId: number, quantity: number) {
    assertPositiveInt(quantity);

    return prisma.$transaction(async (tx) => {
        const item = await getOrCreateInventoryItem(tx, productId, warehouseId);

        if (item.quantity < quantity) {
            throw badRequest(
                `Cannot remove ${quantity} units: only ${item.quantity} available in this warehouse`
            );
        }

        const updated = await tx.inventoryItem.update({
            where: { id: item.id },
            data: { quantity: { decrement: quantity } },
        });

        await tx.stockMovement.create({
            data: { type: MovementType.REMOVE, productId, warehouseId, quantity },
        });

        return updated;
    });
}

export async function transferStock(
    productId: number,
    fromWarehouseId: number,
    toWarehouseId: number,
    quantity: number
) {
    assertPositiveInt(quantity);

    if (fromWarehouseId === toWarehouseId) {
        throw badRequest("Source and destination warehouses must be different");
    }

    // Everything below runs in ONE database transaction: if any step fails
    // (e.g. insufficient stock), Postgres rolls back all of it, so stock can
    // never "disappear" from the source without appearing in the destination.
    return prisma.$transaction(async (tx) => {
        const source = await getOrCreateInventoryItem(tx, productId, fromWarehouseId);

        if (source.quantity < quantity) {
            throw badRequest(
                `Cannot transfer ${quantity} units: only ${source.quantity} available in the source warehouse`
            );
        }

        const destination = await getOrCreateInventoryItem(tx, productId, toWarehouseId);

        const [updatedSource, updatedDestination] = await Promise.all([
            tx.inventoryItem.update({
                where: { id: source.id },
                data: { quantity: { decrement: quantity } },
            }),
            tx.inventoryItem.update({
                where: { id: destination.id },
                data: { quantity: { increment: quantity } },
            }),
        ]);

        await tx.stockMovement.createMany({
            data: [
                { type: MovementType.TRANSFER_OUT, productId, warehouseId: fromWarehouseId, quantity },
                { type: MovementType.TRANSFER_IN, productId, warehouseId: toWarehouseId, quantity },
            ],
        });

        return { source: updatedSource, destination: updatedDestination };
    });
}