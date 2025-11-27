FROM postgis/postgis:15-3.4-alpine

# Copiamo lo script di inizializzazione nella cartella speciale di Postgres
# Tutto ciò che è in questa cartella viene eseguito al primo avvio
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql