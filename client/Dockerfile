# Stage 1: Build dell'applicazione React
FROM node:22-alpine as build

WORKDIR /app

# Copia i file delle dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Esegue la build (crea la cartella dist)
RUN npm run build

# Stage 2: Web Server Nginx per servire i file
FROM nginx:alpine

# Copia i file compilati dallo Stage 1 alla cartella di Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la nostra configurazione Nginx personalizzata
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Espone la porta 80 standard web
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]