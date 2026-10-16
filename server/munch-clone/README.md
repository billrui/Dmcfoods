# Munch Clone (MERN)

A food ordering web app built with MongoDB, Express, React, and Node.

## Setup

1. Start MongoDB locally.
2. `npm run install:all`
3. `npm run seed`
4. Terminal A: `npm run dev:server`
5. Terminal B: `npm run dev:client`
6. Open http://localhost:5173

## Features

- Browse categories, popular & latest items
- Search modal (tap "Are you hungry?")
- Slide-in cart drawer with quantity controls
- Account/menu drawer (hamburger icon)
- JWT auth (register/login)
- Checkout with delivery/pickup + COD/card
- Order tracking with progress steps

## Stack

- **Client:** React 18, Vite, Tailwind, React Router, Zustand, TanStack Query
- **Server:** Express, Mongoose, JWT, bcrypt
