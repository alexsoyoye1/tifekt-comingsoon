# --- Frontend Build Stage ---
FROM node:18-alpine AS client-build
WORKDIR /app
COPY client ./client
WORKDIR /app/client
RUN npm install && npm run build

# --- Backend Build Stage ---
FROM node:18-alpine AS server-build
WORKDIR /app
COPY server ./server
COPY --from=client-build /app/client/dist ./server/client/dist
WORKDIR /app/server
RUN npm install --production

# --- Final Stage ---
FROM node:18-alpine
WORKDIR /app
COPY --from=server-build /app/server .
EXPOSE 4000
CMD ["node", "server.js"]
