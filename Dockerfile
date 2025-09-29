    # --- ETAPA 1: El Constructor (Builder) ---
    # Usamos una imagen oficial de Node.js para construir el proyecto.
    # La versión debe coincidir con la que usas en desarrollo (ej. 20).
    FROM node:20-alpine AS builder

    # Establecemos el directorio de trabajo dentro del contenedor
    WORKDIR /app

    # Copiamos los archivos de dependencias
    COPY package*.json ./

    # Instalamos las dependencias de producción
    RUN npm install

    # Copiamos el resto del código fuente de la aplicación
    COPY . .

    # Construimos la aplicación para producción. Esto crea la carpeta .next
    RUN npm run build

    # --- ETAPA 2: El Ejecutor (Runner) ---
    # Usamos una imagen más pequeña y segura para ejecutar la app ya construida
    FROM node:20-alpine AS runner

    WORKDIR /app

    # Creamos un usuario no-root por seguridad
    RUN addgroup -g 1001 -S nodejs
    RUN adduser -S nextjs -u 1001

    # Copiamos los artefactos de la construcción desde la etapa 'builder'
    COPY --from=builder /app/public ./public
    COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json

    # Cambiamos al usuario no-root
    USER nextjs

    # Exponemos el puerto en el que Next.js corre por defecto
    EXPOSE 3000

    # El comando para iniciar la aplicación en modo producción
    CMD ["npm", "start"]
    
