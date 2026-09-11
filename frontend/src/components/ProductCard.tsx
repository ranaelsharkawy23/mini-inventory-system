import { useState } from "react";
import type { Product, Warehouse } from "../types";
import { InventoryActions } from "./InventoryActions";

interface Props {
    product: Product;
    warehouses: Warehouse[];
    onChanged: () => void;
}

export function ProductCard({ product, warehouses, onChanged }: Props) {
    const [expanded, setExpanded] = useState(false);

    // Show every warehouse (quantity 0 if the product has no row there yet) so
    // the user can add stock to a warehouse the product isn't in yet.
    const rows = warehouses.map((w) => {
        const item = product.inventoryItems.find((i) => i.warehouseId === w.id);
        return { warehouse: w, quantity: item?.quantity ?? 0 };
    });

    const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);

    return (
        <div className="card">
            <button className="card__header" onClick={() => setExpanded((e) => !e)}>
        <span className="card__title">
          {product.name} <span className="muted">({product.sku})</span>
        </span>
                <span className="muted">
          {totalUnits} units total {expanded ? "▲" : "▼"}
        </span>
            </button>

            {expanded && (
                <table className="table">
                    <thead>
                    <tr>
                        <th>Warehouse</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map(({ warehouse, quantity }) => (
                        <tr key={warehouse.id}>
                            <td>{warehouse.name}</td>
                            <td>{quantity}</td>
                            <td>
                                <InventoryActions
                                    productId={product.id}
                                    warehouseId={warehouse.id}
                                    warehouses={warehouses}
                                    onChanged={onChanged}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}