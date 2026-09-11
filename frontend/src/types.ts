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