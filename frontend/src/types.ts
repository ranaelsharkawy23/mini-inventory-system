export interface Warehouse {
    id: number;
    name: string;
    location: string | null;
}

export interface InventoryItem {
    id: number;
    productId: number;
    warehouseId: number;
    quantity: number;
    warehouse: Warehouse;
}

export interface Product {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    inventoryItems: InventoryItem[];
}
export interface StockMovement {
    id: number;
    type: "ADD" | "REMOVE" | "TRANSFER_IN" | "TRANSFER_OUT";
    productId: number;
    warehouseId: number;
    quantity: number;
    createdAt: string;
    product: { name: string; sku: string };
    warehouse: { name: string };
}