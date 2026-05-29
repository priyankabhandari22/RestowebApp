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

- Root Directory: `restowebapp`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
