# --- 1. BUILD AŞAMASI (Derleme Ortamı) ---
# Üretim imajının daha küçük olması için derlemeyi ayrı bir aşamada yaparız.
FROM node:18-alpine AS builder 
WORKDIR /app
# package.json ve lock dosyasını kopyala
COPY package*.json ./
# Tüm bağımlılıkları yükle (devDependencies dahil)
RUN npm install
# Geri kalan kodları kopyala
COPY . .
# TypeScript kodunu JavaScript'e derle
RUN npm run build 

# --- 2. PRODUCTION AŞAMASI (Çalıştırma Ortamı) ---
# Sadece gerekli olan dosyaları içeren temiz ve küçük bir imaj.
FROM node:18-alpine 
WORKDIR /app

# Sadece üretim (production) bağımlılıklarını yükle (daha küçük imaj için)
COPY package*.json ./
RUN npm install --only=production

# Derlenmiş JS dosyalarını ve .env dosyasını kopyala
COPY --from=builder /app/dist ./dist 
COPY .env ./

EXPOSE 3000

# Uygulama portunu tanımla (Dockerfile'da EN İYİ yöntem budur)
ENV PORT 3000 
ENV NODE_ENV production

# Uygulamayı başlat
CMD ["npm", "start"]