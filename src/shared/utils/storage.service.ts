import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // İlerde gerekirse diye
import dotenv from 'dotenv';

dotenv.config();

// R2 İstemcisi
const s3Client = new S3Client({
    region: "auto", // R2 için hep 'auto'
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ""
    }
});

export const storageService = {
    /**
     * Dosyayı R2 Bucket'ına yükler.
     * @param file - Multer'dan gelen dosya objesi
     * @param folder - Klasör adı (örn: "dealers/logos")
     */
    async uploadFile(file: Express.Multer.File, folder: string = "uploads"): Promise<string> {
        try {
            // Benzersiz dosya adı: zaman_damgasi-orijinal_isim
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL: 'public-read' // R2'de genelde bucket ayarlarından açılır
            });

            await s3Client.send(command);

            console.log(`✅ [Storage]: Dosya yüklendi -> ${fileName}`);

            // Public URL döndür
            // Not: R2 Bucket'ının "Public Access" özelliği açık olmalı veya Custom Domain bağlı olmalı.
            return `${process.env.R2_PUBLIC_URL}/${fileName}`;

        } catch (error) {
            console.error("❌ [Storage Error]: Upload failed", error);
            throw new Error("Dosya yüklenemedi.");
        }
    },

    /**
     * Dosyayı R2'den siler.
     * @param fileUrl - Silinecek dosyanın tam URL'i veya Key'i
     */
    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // URL'den Key'i (dosya adını) çıkar
            // Örn: https://pub-xxx.r2.dev/dealers/logos/123.png -> dealers/logos/123.png
            const key = fileUrl.replace(`${process.env.R2_PUBLIC_URL}/`, "");

            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key
            });

            await s3Client.send(command);
            console.log(`🗑️ [Storage]: Dosya silindi -> ${key}`);
        } catch (error) {
            console.error("❌ [Storage Error]: Delete failed", error);
            // Hata olsa bile akışı bozma
        }
    }
};