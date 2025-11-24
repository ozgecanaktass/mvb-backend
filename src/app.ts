import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// --- Uygulama Başlatma ---
const app: Application = express();

// --- Global Middleware'ler (Ara Katman Yazılımları) ---
// İstekler rotalara ulaşmadan önce bu güvenlik kontrollerinden geçer.

// 1. Güvenlik: HTTP başlıklarını (headers) otomatik olarak güvenli hale getirir.
// Örn: X-Powered-By başlığını gizler ki saldırganlar teknolojimizi bilmesin.
app.use(helmet());

// 2. CORS: Tarayıcı güvenliği.
// Şimdilik herkese izin veriyoruz, prodüksiyonda sadece configurator.com'a izin verilecek.
app.use(cors());

// 3. Body Parser: Gelen isteklerin gövdesindeki (body) JSON verisini okumamızı sağlar.
// Bunu yapmazsak req.body 'undefined' gelir.
app.use(express.json());

// --- Temel Sağlık Kontrolü (Health Check) ---
// Load Balancer veya Azure App Service, uygulamanın yaşayıp yaşamadığını buradan kontrol eder.
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Gözlük Bayi Yönetimi API (MVB) aktif durumda',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// --- Rota Yönlendirmeleri (Placeholder) ---
// Yarın Auth ve Dealer modüllerini buraya bağlayacağız.
// app.use('/api/v1/auth', authRoutes);

// --- 404 (Not Found) Handler ---
// Tanımlı olmayan bir adrese istek gelirse burası yakalar.
app.use((req: Request, res: Response) => {
  console.warn(`[404]: ${req.method} ${req.originalUrl} rotası bulunamadı.`);
  res.status(404).json({ 
    error: 'Endpoint bulunamadı',
    path: req.originalUrl 
  });
});

// --- Global Hata Yönetimi ---
// Uygulamanın herhangi bir yerinde hata oluşursa burası yakalar.
// Sunucunun çökmesini engeller ve kullanıcıya düzgün bir hata mesajı döner.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Kritik Hata]:', err.stack);
  
  res.status(500).json({ 
    error: 'Sunucu Hatası', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu.' 
  });
});

export default app;