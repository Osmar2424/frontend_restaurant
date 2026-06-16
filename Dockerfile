FROM node:24-slim AS builder

WORKDIR /app

# 1. Copiamos los archivos de dependencias nativos de npm
COPY package.json package-lock.json ./

# 2. Instalamos de forma limpia y estricta (el equivalente de npm)
RUN npm ci

# 3. Copiamos el resto del código y pasamos las variables de entorno
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 4. Compilamos el frontend
RUN npm run build

# --- Etapa de producción con Nginx ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
