# Usa uma imagem base do Nginx
FROM nginx:alpine

# Define o diretório de trabalho dentro do container
WORKDIR /usr/share/nginx/html

# Remove os arquivos padrão do Nginx
RUN rm -rf ./*

# Copia todos os arquivos do frontend para o container
COPY . .

# Expõe a porta 80 para acessar o frontend
EXPOSE 5600

# Comando padrão para rodar o Nginx
CMD ["nginx", "-g", "daemon off;"]
