FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/src ./src
COPY --from=frontend-build /app/client/dist ./public
ENV PORT=3001
EXPOSE 3001
CMD ["node", "src/index.js"]
