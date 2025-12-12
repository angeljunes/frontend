# Usa la imagen oficial de Nginx
FROM nginx:alpine

# Borra el contenido por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia tu proyecto (HTML, CSS, JS)
COPY . /usr/share/nginx/html

# Expone puerto 80
EXPOSE 80

# Arranca Nginx
CMD ["nginx", "-g", "daemon off;"]
