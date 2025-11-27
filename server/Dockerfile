# Usa un'immagine Node.js ufficiale leggera
FROM node:18-alpine

# Imposta la directory di lavoro nel container
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il resto del codice sorgente
COPY . .

# Compila il codice TypeScript (crea la cartella dist)
RUN npm run build

# Copia manualmente la cartella public (con il GeoJSON) dentro la build
RUN cp -r src/public dist/src/

# Esponi la porta su cui gira il server (come da .env)
EXPOSE 3001

# Comando per avviare l'applicazione compilata
CMD ["npm", "start"]