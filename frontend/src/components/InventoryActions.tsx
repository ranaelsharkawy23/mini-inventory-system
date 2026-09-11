import { useState } from "react";
import { api } from "../api";
import type { Warehouse } from "../types";

type Mode = "add" | "remove" | "transfer";

interface Props {
    productId: number;
    warehouseId: number;
    warehouses: Warehouse[]; // all warehouses, to populate the "transfer to" select
    onChanged: () => void; // ask the parent to reload product data
}

/** Add / Remove / Transfer controls for a single (product, warehouse) row. */
export function InventoryActions({ productId, warehouseId, warehouses, onChanged }: Props) {
    const [mode, setMode] = useState<Mode | null>(null);
    const [quantity, setQuantity] = useState("");
    const [targetWarehouseId, setTargetWarehouseId] = useState<number | "">("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const otherWarehouses = warehouses.filter((w) => w.id !== warehouseId);

    function reset() {
        setMode(null);
        setQuantity("");
        setTargetWarehouseId("");
        setError(null);
    }

    async function submit() {
        const amount = Number(quantity);
        if (!Number.isInteger(amount) || amount <= 0) {
            setError("Enter a positive whole number");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            if (mode === "add") {
                await api.addStock({ productId, warehouseId, quantity: amount });
            } else if (mode === "remove") {
                await api.removeStock({ productId, warehouseId, quantity: amount });
            } else if (mode === "transfer") {
                if (targetWarehouseId === "") {
                    setError("Choose a destination warehouse");
                    setSubmitting(false);
                    return;
                }
                await api.transferStock({
                    productId,
                    fromWarehouseId: warehouseId,
                    toWarehouseId: Number(targetWarehouseId),
                    quantity: amount,
                });
            }
            reset();
            onChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    if (mode === null) {
        return (
            <div className="actions">
                <button onClick={() => setMode("add")}>Add Stock</button>
                <button onClick={() => setMode("remove")}>Remove Stock</button>
                <button onClick={() => setMode("transfer")} disabled={otherWarehouses.length === 0}>
                    Transfer
                </button>
            </div>
        );
    }

    return (
        <div className="actions actions--open">
            <input
                type="number"
                min={1}
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
            />
            {mode === "transfer" && (
                <select
                    value={targetWarehouseId}
                    onChange={(e) => setTargetWarehouseId(e.target.value ? Number(e.target.value) : "")}
                >
                    <option value="">To warehouse…</option>
                    {otherWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                            {w.name}
                        </option>
                    ))}
                </select>
            )}
            <button onClick={submit} disabled={submitting}>
                {submitting ? "Saving…" : "Confirm"}
            </button>
            <button onClick={reset} disabled={submitting}>
                Cancel
            </button>
            {error && <span className="error">{error}</span>}
        </div>
    );
}