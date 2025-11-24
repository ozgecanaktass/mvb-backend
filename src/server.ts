// .env dosyasını en tepeye import ediyoruz ki tüm dosyalardan erişilebilsin.
import dotenv from 'dotenv';
dotenv.config();

import app from './app';

// Portu .env'den al, yoksa 3000 kullan
const PORT = process.env.PORT || 3000;

// --- Sunucuyu Başlat ---
const server = app.listen(PORT, () => {
  console.log(`
  ################################################
  🚀  Sunucu Başarıyla Ayağa Kalktı!
  📡  Adres: http://localhost:${PORT}
  🛠️   Ortam: ${process.env.NODE_ENV}
  ################################################
  `);
});

// --- Hata Yakalama (Graceful Shutdown) ---
// Beklenmeyen bir Promise hatası (örn: DB bağlantısı koptu) olursa logla.
// Bu mekanizmalar, uzun süreli projeler için kritik öneme sahiptir.
process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Yakalanmayan Promise Reddi:', reason.message);
  // İleride burada sunucuyu kontrollü kapatma kodu olabilir.
});

// Beklenmeyen bir kod hatası (örn: olmayan değişken kullanımı) olursa.
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Yakalanmayan İstisna:', error.message);
  process.exit(1); // Güvenlik için süreci öldür (Docker/PM2 yeniden başlatacaktır).
});