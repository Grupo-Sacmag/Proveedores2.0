FROM ubuntu:24.04

# Evitar prompts interactivos durante apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Actualizar el sistema e instalar utilidades básicas y Node.js 16 desde NodeSource
RUN apt-get update && apt-get install -y curl ca-certificates build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Configurar el directorio de trabajo
WORKDIR /app

# Copiar los archivos de configuración del proyecto
COPY package*.json ./

# Instalar las dependencias de npm
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto donde corre la API
EXPOSE 3000

# Comando para iniciar la aplicación (usando node en lugar de nodemon para producción)
CMD ["node", "index.js"]
