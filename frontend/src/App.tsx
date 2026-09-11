import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Product, Warehouse } from "./types";
import { ProductCard } from "./components/ProductCard";
import { NewProductForm } from "./components/NewProductForm";
import { NewWarehouseForm } from "./components/NewWarehouseForm";

export default function App() {
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAll = useCallback(async () => {
        try {
            const [productsData, warehousesData] = await Promise.all([
                api.getProducts(),
                api.getWarehouses(),
            ]);
            setProducts(productsData);
            setWarehouses(warehousesData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    return (
        <div className="app">
            <h1>Mini Inventory System</h1>

            {error && <p className="error">{error}</p>}

            <div className="forms">
                <NewProductForm onCreated={loadAll} />
                <NewWarehouseForm onCreated={loadAll} />
            </div>

            <h2>Products</h2>
            {loading ? (
                <p>Loading…</p>
            ) : products.length === 0 ? (
                <p className="muted">No products yet — create one above.</p>
            ) : (
                <div className="cards">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            warehouses={warehouses}
                            onChanged={loadAll}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}