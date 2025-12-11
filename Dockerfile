# --- 1. BUILD AŞAMASI (Derleme Ortamı) ---
FROM node:18-alpine AS builder

WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json ./

# TÜM bağımlılıkları yükle (devDependencies dahil - ts-node-dev burada)
RUN npm install

# Kaynak kodları kopyala
COPY . .

# TypeScript'i derle (dist klasörüne)
RUN npm run build


# --- 2. DEVELOPMENT & PRODUCTION AŞAMASI ---
FROM node:18-alpine

WORKDIR /app

# package.json'ı kopyala
COPY package*.json ./

# TÜM bağımlılıkları tekrar yükle (ts-node-dev'in çalıştığından emin olmak için)
# Yerel geliştirmede 'npm run dev' komutu ts-node-dev'i arayacak.
RUN npm install

# Derlenmiş dosyaları ve kaynak kodları kopyala (Hot reload için kaynak kodlar önemli)
COPY --from=builder /app/dist ./dist
COPY . .

# Portu dışarı aç
EXPOSE 3000

# Varsayılan komut (Docker Compose bunu ezecek ama yine de bulunsun)
CMD ["npm", "run", "dev"]