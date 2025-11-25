export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    /**
     * @param message hata mesajı
     * @param statusCode HTTP durum kodu (401 Unauthorized, 404 Not Found)
     */
    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        // isOperational: true demek, bu hatanın bizim kontrolümüz dahilinde fırlatıldığı
        // ve kullanıcıya güvenle gösterilebileceği anlamına gelir (Örn: "Şifre yanlış").
        this.isOperational = true; 

        Error.captureStackTrace(this, this.constructor);
    }
}