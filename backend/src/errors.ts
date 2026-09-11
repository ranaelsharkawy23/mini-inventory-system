
export class AppError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "AppError";
    }
}

export const badRequest = (message: string) => new AppError(400, message);
export const notFound = (message: string) => new AppError(404, message);