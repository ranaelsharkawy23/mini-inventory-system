import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Product, Warehouse } from "./types";
import { ProductCard } from "./components/ProductCard";
import { NewProductForm } from "./components/NewProductForm";
import { NewWarehouseForm } from "./components/NewWarehouseForm";
import { MovementsLog } from "./components/MovementsLog";
import { LoginForm } from "./components/LoginForm";
import { clearToken, getToken } from "./auth";

export default function App() {
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [authenticated, setAuthenticated] = useState(() => getToken() !== null);

    const loadAll = useCallback(async () => {
        try {
            const [productsData, warehousesData] = await Promise.all([
                api.getProducts(),
                api.getWarehouses(),
            ]);
            setProducts(productsData);
            setWarehouses(warehousesData);
            setError(null);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authenticated) loadAll();
    }, [authenticated, loadAll]);

    if (!authenticated) {
        return <LoginForm onAuthenticated={() => setAuthenticated(true)} />;
    }

    return (
        <div className="app">
            <button
                onClick={() => {
                    clearToken();
                    setAuthenticated(false);
                }}
                style={{ float: "right" }}
            >
                Log Out
            </button>
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
            <MovementsLog refreshKey={refreshKey} />
        </div>
    );
}