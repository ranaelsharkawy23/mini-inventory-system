import type { Product, StockMovement, Warehouse } from "./types";
import { clearToken, getToken } from "./auth";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getToken();

    const res = await fetch(`${BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
    });

    if (res.status === 401) {
        clearToken();
        window.location.reload();
        throw new Error("Session expired — please log in again");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
    }
    return res.json();
}

export const api = {
    login: (data: { email: string; password: string }) =>
        request<{ token: string; user: { id: number; email: string } }>("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    register: (data: { email: string; password: string }) =>
        request<{ token: string; user: { id: number; email: string } }>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),

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