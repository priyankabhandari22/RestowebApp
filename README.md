# Restowebapp Fullstack

This project is split into a React + Vite frontend and an Express + MongoDB backend.

## What it uses

- Live menu data from TheMealDB via the Express API
- MongoDB for order & users data storage
- Vite proxy for `/api` in development

## Project Structure

- `frontend/` - React app, Vite config, public assets
- `backend/` - Express server and MongoDB models

## Run locally

```bash
npm install
npm run dev
```

The frontend runs from `frontend/` and the backend runs from `backend/` at the same time.

## Build

```bash
npm run build
```

## API routes

- `GET /api/menu` - returns live menu items
- `POST /api/orders` - saves an order to MongoDB
- `GET /api/orders` - returns saved orders
- `GET /api/users` - returns saved customers

## Deploy Notes

For Render, set:

- Root Directory: the repo root for this service, not `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

If Render is running `npm start` during the build phase, the deploy will fail because dependencies are not installed yet. If Render is pointing the service root at `backend`, the start command will resolve to `backend/backend/server.js` and fail with `MODULE_NOT_FOUND`. Keep the service root at the repo root and keep the Start Command as `npm start`.
