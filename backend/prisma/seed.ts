/**
 * Optional convenience seed so the app isn't empty on first run.
 * Run with: npm run seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const [cairo, alex] = await Promise.all([
        prisma.warehouse.upsert({
            where: { name: "Cairo Warehouse" },
            update: {},
            create: { name: "Cairo Warehouse", location: "Cairo, EG" },
        }),
        prisma.warehouse.upsert({
            where: { name: "Alexandria Warehouse" },
            update: {},
            create: { name: "Alexandria Warehouse", location: "Alexandria, EG" },
        }),
    ]);

    const keyboard = await prisma.product.upsert({
        where: { sku: "KB-100" },
        update: {},
        create: { sku: "KB-100", name: "Mechanical Keyboard", description: "87-key mechanical keyboard" },
    });

    await prisma.inventoryItem.upsert({
        where: { productId_warehouseId: { productId: keyboard.id, warehouseId: cairo.id } },
        update: {},
        create: { productId: keyboard.id, warehouseId: cairo.id, quantity: 25 },
    });

    console.log("Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });