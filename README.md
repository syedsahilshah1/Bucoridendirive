# BUCORIDE – Ride-Hailing & Parcel Delivery Platform (Kenya)

> **Theme**: Yellow & fadings (`#EAB308`, `#FACC15`), dark grey charcoal (`#0B0F17`), and live interactive background canvas.

BUCORIDE is a web-based transportation ecosystem built for Kenya, connecting drivers, motorcycle (boda boda) riders, and customers.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: **Laravel 11** (PHP 8.2+) with Laravel Sanctum token guards, policy gates, and Eloquent ORM.
- **Real-Time WebSockets**: **Laravel Reverb** (first-party WebSocket server on port `8080`).
- **Frontend SPA**: **React 19 (Vite) + TypeScript + Tailwind CSS v4** + Leaflet Interactive Maps.
- **Client Realtime**: **Laravel Echo** + `pusher-js`.
- **Database**: SQLite (local development) / PostgreSQL 16 (production ready with spatial distance queries).
- **Anti-Abuse Engine**: **FingerprintJS** hardware fingerprinting + device hash registry.
- **Billing & Subscriptions**: **Safaricom M-Pesa Daraja STK Push** simulation & webhook reconciliation.

---

## 🚀 Key Features Implemented According to Requirements

1. **Driver & Rider Registration (Section 2)**:
   - Full name, phone (+254...), email, password.
   - Vehicle registration: Model and number plate (registration).
   - Selection between **CAR** and **MOTORCYCLE**.
   - Service category: **PSV** or **PRIVATE HIRE / CHAUFFEUR**.
2. **Driver Subscription System (Section 3)**:
   - **Motorcycles**: KSh 249 / 30 days.
   - **Cars**: KSh 549 / 30 days.
   - **1st Month Free Trial**: Newly registered drivers receive 1 month free, with an explicit **"Activate 1-Month Free Trial"** button required before receiving customer bookings.
   - Expiration status, expiry dates, renewal via Safaricom M-Pesa STK Push. Expired subscriptions automatically lose ability to accept bookings.
3. **Simulated Opportunity Generator (Section 4 & 15)**:
   - Periodic realistic opportunities with random Kenyan pickup/destinations and estimated amounts.
   - Tagged prominently as `[SAMPLE OPPORTUNITY - NOT ACTUAL RIDE]`.
   - Driver dashboard displays total received, missed opportunities count, and combined estimated potential value.
4. **Google Maps & GPS Integration (Section 5 & 14)**:
   - Automatic road distance and duration calculation using cruising speed 60 KM/H formula: $\text{Distance} \div 60 \times 60 \text{ min} = \text{Distance in minutes}$.
   - Live GPS coordinate broadcasting between drivers and passengers.
5. **Customer Free Ride Policy & Anti-Abuse (Section 7)**:
   - Every newly registered customer receives **ONE free ride up to KSh 100**, covered entirely by BUCORIDE management.
   - Strictly enforced at **1 ride per person AND 1 per device** using hardware fingerprinting.
   - Overages exceeding KSh 100 are automatically calculated for the customer to pay.
6. **Passenger Requests & Live Fare Negotiation (Section 8, 9, 10)**:
   - Pickup & destination mapping.
   - Dynamic pricing benchmarked on **Bolt Kenya** (motorcycle & car rates).
   - Real-time bargaining: Customer proposes fare $\rightarrow$ Driver can Accept, Reject, or Counteroffer with custom amount.
   - Final agreed fare locked before trip departure.
   - Driver matching lock: prevents multiple drivers from accepting the same request.
   - Customer sees driver full name, phone number, vehicle model, plate number, and live map location.
7. **Parcel Delivery & Live Tokenized Tracking (Section 11 & 12)**:
   - Sender and receiver details, package description, pickup/delivery points.
   - Automated delivery fare calculation.
   - Rider assignment and status milestones (`Pending` $\rightarrow$ `Accepted` $\rightarrow$ `Collected` $\rightarrow$ `In Transit` $\rightarrow$ `Delivered`).
   - Secure public tracking URL (`/track/:token`) allowing senders and receivers to follow the rider on a live map without logging in.
8. **Administration Dashboard (Section 17)**:
   - Real-time active fleet map with online driver markers.
   - Driver verification, vehicle fleet logs, suspension toggle.
   - Live Pricing Engine Configurator (Base fare, per KM rate, per min rate, minimum fare).
   - Anti-abuse device registry with duplicate device detection and admin voucher reset.
   - Platform revenue and transaction volume analytics.

---

## ⚡ Quick Start

### 1. Launch with Batch Script (Windows)
Double-click `start-bucoride.bat` or run:
```powershell
.\start-bucoride.bat
```

### 2. Manual Launch
**Terminal 1 (Backend API)**:
```bash
cd backend
php artisan serve --port=8000
```

**Terminal 2 (Reverb WebSockets)**:
```bash
cd backend
php artisan reverb:start --port=8080
```

**Terminal 3 (Frontend)**:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Features / Details |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@bucoride.com` | `password` | KSh 100 Free Ride Voucher active, ride requests, parcel courier. |
| **Boda Driver** | `driver.boda@bucoride.com` | `password` | Motorcycle (Bajaj Boxer 150cc, `KMDF 452X`), PSV, trial active, online. |
| **Car Driver** | `driver.car@bucoride.com` | `password` | Car (Toyota Premio 1.8G, `KDA 890Y`), Private Hire, KSh 549 sub active, online. |
| **Admin** | `admin@bucoride.com` | `password` | Super Admin console, live fleet map, pricing configurator. |

*(Single-click login buttons for all roles are also provided directly in the Sign In modal).*
