import { FormEvent, useState } from "react";
import { api } from "../api";

export function NewProductForm({ onCreated }: { onCreated: () => void }) {
    const [sku, setSku] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            await api.createProduct({ sku, name });
            setSku("");
            setName("");
            onCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create product");
        }
    }

    return (
        <form className="form" onSubmit={handleSubmit}>
            <h3>New Product</h3>
            <input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <button type="submit">Create Product</button>
            {error && <span className="error">{error}</span>}
        </form>
    );
}
