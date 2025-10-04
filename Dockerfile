# Stage 1: Build the application
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application from Nginx
FROM nginx:1.27-alpine
COPY --from=builder /app/dist/ociprodetfe/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

