# Book Finder & Wishlist

A book-search application built with React, Vite, Node.js, Express, MongoDB, and Google Books API. No PHP is used.

## Features
- Search books through Google Books API
- Show title, thumbnail, authors, and star rating
- Save/remove wishlist items in MongoDB
- Responsive UI, loading and error states
- Docker Compose support

## Run locally
Requirements: Node.js 20+ and MongoDB (or use Docker Compose).

1. Copy `server/.env.example` to `server/.env` if you are not using Docker.
2. Install dependencies:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```
3. Start MongoDB locally, then run:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173

The frontend calls the Express backend at `/api`; Vite proxies these requests to `http://localhost:3001`.

## Run with Docker
```bash
docker compose up --build
```
Open http://localhost:8080. MongoDB data is persisted in a Docker volume.

## API endpoints
- `GET /api/books?q=keyword` — search Google Books
- `GET /api/wishlist` — list saved books
- `POST /api/wishlist` — save a book
- `DELETE /api/wishlist/:googleBookId` — remove a saved book
- `GET /api/health` — health check

## Publish and demo
Create a public GitHub repository and push this project. For a public demo, deploy the frontend and backend to a hosting provider and use a hosted MongoDB database (for example, MongoDB Atlas). Set `MONGODB_URI` in the backend environment. This generated project is not automatically published or deployed by creating the files here.
