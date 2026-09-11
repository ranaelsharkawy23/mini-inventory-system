import { FormEvent, useState } from "react";
import { api } from "../api";

export function NewWarehouseForm({ onCreated }: { onCreated: () => void }) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            await api.createWarehouse({ name, location });
            setName("");
            setLocation("");
            onCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create warehouse");
        }
    }

    return (
        <form className="form" onSubmit={handleSubmit}>
            <h3>New Warehouse</h3>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit">Create Warehouse</button>
            {error && <span className="error">{error}</span>}
        </form>
    );
}