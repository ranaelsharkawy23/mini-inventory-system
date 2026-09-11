import { prisma } from "../db";
import { addStock, removeStock, transferStock } from "./inventoryService";

let productId: number;
let warehouseAId: number;
let warehouseBId: number;

beforeAll(async () => {
    const product = await prisma.product.create({
        data: { sku: `TEST-${Date.now()}`, name: "Test Product" },
    });
    const warehouseA = await prisma.warehouse.create({ data: { name: `Test Warehouse A ${Date.now()}` } });
    const warehouseB = await prisma.warehouse.create({ data: { name: `Test Warehouse B ${Date.now()}` } });

    productId = product.id;
    warehouseAId = warehouseA.id;
    warehouseBId = warehouseB.id;
});

afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { productId } });
    await prisma.inventoryItem.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.warehouse.delete({ where: { id: warehouseAId } });
    await prisma.warehouse.delete({ where: { id: warehouseBId } });
    await prisma.$disconnect();
});

describe("addStock", () => {
    it("creates an inventory row and sets the quantity when adding for the first time", async () => {
        const result = await addStock(productId, warehouseAId, 10);
        expect(result.quantity).toBe(10);
    });

    it("accumulates on top of existing stock", async () => {
        const result = await addStock(productId, warehouseAId, 5);
        expect(result.quantity).toBe(15);
    });

    it("rejects a zero or negative quantity", async () => {
        await expect(addStock(productId, warehouseAId, 0)).rejects.toThrow("positive integer");
        await expect(addStock(productId, warehouseAId, -3)).rejects.toThrow("positive integer");
    });
});

describe("removeStock", () => {
    it("decreases the quantity", async () => {
        const result = await removeStock(productId, warehouseAId, 5);
        expect(result.quantity).toBe(10);
    });

    it("rejects removing more than what's available", async () => {
        await expect(removeStock(productId, warehouseAId, 999)).rejects.toThrow("only 10 available");
    });
});

describe("transferStock", () => {
    it("moves quantity from source to destination", async () => {
        const result = await transferStock(productId, warehouseAId, warehouseBId, 4);
        expect(result.source.quantity).toBe(6);
        expect(result.destination.quantity).toBe(4);
    });

    it("rejects transferring more than the source has", async () => {
        await expect(transferStock(productId, warehouseAId, warehouseBId, 999)).rejects.toThrow(
            "only 6 available"
        );
    });

    it("rejects transferring to the same warehouse", async () => {
        await expect(transferStock(productId, warehouseAId, warehouseAId, 1)).rejects.toThrow(
            "must be different"
        );
    });
});