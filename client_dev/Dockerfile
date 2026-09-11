# ETAPA 1: Construcción (Build)
FROM ubuntu:24.04 AS build

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias para compilar y Node.js 16 desde NodeSource
RUN apt-get update && apt-get install -y curl ca-certificates build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias e instalarlas
COPY package*.json ./
# Usamos legacy-peer-deps por ser Angular 12 que a veces tiene conflictos con npm 7/8
RUN npm install --legacy-peer-deps

# Copiar todo el código fuente del frontend
COPY . .

# Compilar Angular para producción
RUN npm run build -- --configuration production

# ETAPA 2: Servidor Web (Nginx)
FROM ubuntu:24.04

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalar Nginx
RUN apt-get update && apt-get install -y nginx && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Remover configuración de Nginx por defecto
RUN rm /etc/nginx/sites-enabled/default

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/sites-available/proveedores
RUN ln -s /etc/nginx/sites-available/proveedores /etc/nginx/sites-enabled/

# Limpiar directorio base de nginx y copiar los archivos compilados de la Etapa 1
RUN rm -rf /var/www/html/*
COPY --from=build /app/dist/Proveedores-Sacmag /var/www/html/

# Configurar Nginx para que corra en primer plano (necesario para Docker)
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Exponer el puerto
EXPOSE 80

# Iniciar Nginx
CMD ["nginx"]
