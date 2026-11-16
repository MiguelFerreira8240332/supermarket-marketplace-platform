# 🛒 Supermarket Marketplace Platform

[🇵🇹 Português](README.pt.md) · 🇬🇧 English

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Swagger](https://img.shields.io/badge/API-Swagger%2FOpenAPI-85EA2D?logo=swagger&logoColor=black)
![Type](https://img.shields.io/badge/Type-University%20Project-lightgrey)

A **full-stack web marketplace** that connects supermarkets, customers and couriers. Customers browse supermarkets and products, build a cart and pay online; supermarkets manage their catalogue and orders; couriers pick up and deliver; and an admin oversees the whole platform.

The system is split into two applications that share one API:

- **FrontOffice** – a customer-facing single-page app built with **Angular + TypeScript**.
- **BackOffice** – a server-rendered management area (Express + EJS) for **admins, supermarkets and couriers**.

> 🎓 **Academic context** – Web Applications Programming course project, BSc in Computer Engineering · March – June 2026.
> Built to practise designing a complete web system: REST API, authentication & authorisation, a document database, third-party integrations and a modern SPA.

---

## ✨ Features

### 👤 Customer (Angular FrontOffice)
- Sign up / log in with **JWT** authentication, route guards and an HTTP interceptor.
- Browse **supermarkets** and **products**, with sorting and an interactive **map (Leaflet)** of stores.
- **Cart**, order creation, **online payment with Stripe Checkout** (test mode), order tracking and history.
- Choose between **in-store pickup** or **home delivery**.
- **Favourites** (products and supermarkets), **reviews** of supermarkets and couriers, in-app **notifications**.
- Account area with profile and personal statistics; **light/dark theme**.

### 🏪 Supermarket (BackOffice)
- Manage **categories** and **products** (images via file upload), stock and orders.
- **Counter sale** (in-store sale) flow.
- Account is created in a *pending* state and must be **approved by an admin**.

### 🛵 Courier (BackOffice)
- See **available deliveries**, accept them, track current deliveries and delivery history.
- View received **reviews** and personal **statistics**.

### 🛡️ Admin (BackOffice)
- Approve pending supermarkets (an **email alert** is sent when a new one registers), manage users and orders, view platform **statistics**.

### ⚙️ Platform behaviour
- **Order lifecycle:** `Pendente → Confirmada → Em processamento → Em entrega → Entregue` (or `Cancelada`).
- **Scheduled job (node-cron):** pending orders that are not paid within **5 minutes** are automatically cancelled and their **stock is restored**.
- **Role-based access control** for four roles: `client`, `supermarket`, `courier`, `admin`.
- **API documentation** with Swagger UI (`/api-docs`).

## 🧱 Tech stack

| Layer | Technologies |
|---|---|
| **FrontOffice** | Angular 21 (standalone components, lazy-loaded routes), TypeScript, RxJS, Angular Material/CDK, Bootstrap 5 + Bootstrap Icons, Leaflet, Dark Reader, Vitest |
| **API / BackOffice** | Node.js, Express 4, EJS, express-session, JWT (`jsonwebtoken`), `bcryptjs`, Multer, node-cron, Nodemailer, Swagger UI |
| **Database** | MongoDB (NoSQL) with Mongoose – collections for users, supermarkets, categories, products, orders, favourites, reviews, notifications |
| **Integrations** | Stripe Checkout (payments), SMTP email (Mailtrap / Gmail) |

## 🗂️ Project structure

```
.
├── app.js, bin/www        # Express application & server bootstrap
├── models/                # Mongoose schemas
├── controllers/           # Business logic (orders, products, supermarkets, couriers, admin, reviews…)
├── routes/                # Web routes + REST API (/api)
├── middlewares/           # Auth / role checks
├── views/                 # EJS templates for the BackOffice
├── .env.example           # Environment variables template
├── swagger.json           # OpenAPI documentation
└── frontoffice/           # Angular SPA
    └── src/app/
        ├── pages/         # dashboard, supermarkets, products, cart, orders, favourites, account…
        ├── components/    # header, footer, map, notifications, reviews, login dialog…
        ├── services/      # auth, cart, favourites, products, notifications, theme
        ├── guards/        # AuthGuard
        └── interceptors/  # JWT interceptor
```

## 🚀 Getting started

**Requirements:** Node.js 20.19+ (or 22 LTS), npm, and a MongoDB instance (local or MongoDB Atlas).

```bash
git clone <repository-url>
cd supermarket-marketplace-platform
```

**1. Backend + BackOffice** (http://localhost:3000)

```bash
npm install
```

Create your environment file from the template and fill in your own values (**never commit the real `.env`**):

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (local or Atlas) – **required** |
| `JWT_SECRET` / `SESSION_SECRET` | Secrets for API tokens and BackOffice sessions |
| `STRIPE_SECRET_KEY` | Stripe **test** secret key (`sk_test_...`) for online payments |
| `MAILTRAP_*` / `GMAIL_*` | SMTP credentials for notification emails (optional) |

```bash
npm start
```

API docs are available at `http://localhost:3000/api-docs`.

**2. FrontOffice** (http://localhost:4200)

```bash
cd frontoffice
npm install
npm start
```

The SPA expects the API at `http://localhost:3000/api`.

## 🔭 Roadmap

- [ ] Add automated API tests and expand front-end unit tests.
- [ ] Containerise the stack with Docker Compose (API + SPA + MongoDB).
- [ ] Deploy a live demo.

## 👥 Authors

- **Maria Leonor Araújo** – [LinkedIn](https://www.linkedin.com/in/leonor-araújo-18155138b)
- **Miguel Ferreira** – [LinkedIn](https://www.linkedin.com/in/miguel-brand%C3%A3o-45a004427)
- **Marcelo Pinto**

## 📄 License

Educational project – no license specified. Please contact the authors before reusing the code.
