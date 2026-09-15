
# PharmaPulse Pharmacy Management System

Modern responsive pharmacy operations UI with a secure Node/Express API foundation and a separate FastAPI intelligence service.

## Run locally

1. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
2. Start MongoDB, then run `npm install` and `npm run dev`.
3. Open `http://localhost:5050`.
4. For forecasts: `cd ai-service`, install `requirements.txt`, then `uvicorn main:app --reload --port 8000`.

## Delivery scope

- Dashboard, medicine catalogue, inventory alert concepts, order/COD workspace, POS and report UI.
- JWT registration/login endpoints, validation, hashing, rate limit, Helmet, CORS and core Mongo models.
- API structures show the next modules: users, batches, inventory, suppliers, purchases, customers, prescriptions, invoices, returns, notifications, audit logs and settings.


