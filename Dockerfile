# Build stage: Vite reads the VITE_* values (Entra tenant/client IDs and
# Supabase URL/anon key) from the .env file copied into the build context.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: only the compiled static files are shipped.
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
