<h1 align="center">Welcome to Cyclopt Configurator 👋 </h1>

A web application interface that enables users to easily create, activate and manage their Cyclopt orders.

## 🧩 Features  

- 🆕 **Activate new Orders**  
  Insert an activation key and register a new order.

- ✏️ **Manage Existing Subscriptions**  
  Select a placed order, keep an eye for expired subscriptions, update your plans on spot, add or remove assignees easily, granting or revoking access to specific services or products.  


## 🛠️ Prerequisites

Make sure you have installed:
- [node ↗](https://nodejs.org/en) (>=20)
- [npm ↗](https://www.npmjs.com/)

## 🚀 Getting Started

### 1. Clone repository
```sh
git clone https://github.com/cyclopt/community-configurator.git
cd community-configurator
```

### 2. Install dependencies
```sh
npm install
```

### 3. Set up environment variables
Create a `.env` file and store based on `.env.sample` and fill in your values:

- `VITE_MAIN_SERVER_URL` – URL of the backend API **(Required)** (check the [Cyclopt Community Server](https://github.com/cyclopt/community-server/))
- `VITE_SENTRY_ENVIRONMENT` – Sentry environment **(Optional)**
- `VITE_SENTRY_DSN` – Public DSN for Sentry **(Optional)**


## ▶️ Running the App

### 1. Configure and start backend server

### 2. Start frontend React app
```sh
npm run dev
```

## 🧪 Testing
Run lint tests
```sh
npm test
```

Test production build:
```sh
npm run build && npm run preview
```
