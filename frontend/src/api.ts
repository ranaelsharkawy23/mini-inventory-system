import type {Product, StockMovement, Warehouse} from "./types";
// All requests go through Vite's dev proxy (see vite.config.ts), so a plain
// "/api/..." path works in dev and in a same-origin production build alike.
const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
    }
    return res.json();
}

export const api = {
    getProducts: () => request<Product[]>("/products"),
    createProduct: (data: { sku: string; name: string; description?: string }) =>
        request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),

    getWarehouses: () => request<Warehouse[]>("/warehouses"),
    createWarehouse: (data: { name: string; location?: string }) =>
        request<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(data) }),

    addStock: (data: { productId: number; warehouseId: number; quantity: number }) =>
        request("/inventory/add", { method: "POST", body: JSON.stringify(data) }),
    removeStock: (data: { productId: number; warehouseId: number; quantity: number }) =>
        request("/inventory/remove", { method: "POST", body: JSON.stringify(data) }),
    transferStock: (data: {
        productId: number;
        fromWarehouseId: number;
        toWarehouseId: number;
        quantity: number;
    }) => request("/inventory/transfer", { method: "POST", body: JSON.stringify(data) }),
    getMovements: () => request<StockMovement[]>("/inventory/movements"),
};