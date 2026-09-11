import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { productsRouter } from "./routes/products";
import { warehousesRouter } from "./routes/warehouses";
import { inventoryRouter } from "./routes/inventory";
import { AppError } from "./errors";
import { authRouter } from "./routes/auth";
import { requireAuth } from "./auth";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);

app.use(requireAuth);

app.use("/api/products", productsRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/inventory", inventoryRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));