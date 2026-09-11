import { useEffect, useState } from "react";
import { api } from "../api";
import type { StockMovement } from "../types";

const LABELS: Record<StockMovement["type"], string> = {
    ADD: "Added",
    REMOVE: "Removed",
    TRANSFER_IN: "Transfer in",
    TRANSFER_OUT: "Transfer out",
};

export function MovementsLog({ refreshKey }: { refreshKey: number }) {
    const [movements, setMovements] = useState<StockMovement[]>([]);

    useEffect(() => {
        api.getMovements().then(setMovements).catch(() => setMovements([]));
    }, [refreshKey]);

    if (movements.length === 0) return null;

    return (
        <div className="card">
            <div className="card__header">
                <span className="card__title">Recent Stock Movements</span>
            </div>
            <table className="table">
                <thead>
                <tr>
                    <th>When</th>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Type</th>
                    <th>Quantity</th>
                </tr>
                </thead>
                <tbody>
                {movements.map((m) => (
                    <tr key={m.id}>
                        <td>{new Date(m.createdAt).toLocaleString()}</td>
                        <td>{m.product.name}</td>
                        <td>{m.warehouse.name}</td>
                        <td>{LABELS[m.type]}</td>
                        <td>{m.quantity}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}