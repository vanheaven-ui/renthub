<p align="center">
  <h1>RentHub P2P</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built_for-Uganda's_Rental_Ecosystem-8A2BE2?style=for-the-badge&logo=react&logoColor=white" alt="Built for Uganda Badge" />
  <img src="https://img.shields.io/badge/Next.js_13+-App_Router_Enabled-FF69B4?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js Badge" />
  <img src="https://img.shields.io/badge/AI_Powered_by-Google_Gemini_2.5_Flash-7B68EE?style=for-the-badge&logo=google&logoColor=white" alt="Gemini Badge" />
  <img src="https://img.shields.io/badge/Real_Time-Chat_with_Socket.io-FF00FF?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io Badge" />
  <img src="https://img.shields.io/badge/Mobile_Money-Demo_Ready-00CED1?style=for-the-badge&logo=android&logoColor=white" alt="Mobile Money Badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_Powered-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres Badge" />
  <img src="https://img.shields.io/badge/License-MIT-32CD32?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="MIT License Badge" />
  <img src="https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Database Badge" />
  <img src="https://img.shields.io/badge/Storage-Supabase_Buckets-249C5A?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Storage Badge" />
</p>

<p align="center">
  <a href="https://renthub-p2p.vercel.app/"><img src="https://img.shields.io/badge/🌍_Live_Demo-Vercel_Deployed-0ABAB5?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://renthub-docs.vercel.app/"><img src="https://img.shields.io/badge/📘_API_Docs-Swagger_Ready-4682B4?style=for-the-badge&logo=swagger&logoColor=white" alt="API Docs" /></a>
  <a href="https://github.com/yourusername/renthub-p2p/issues"><img src="https://img.shields.io/badge/💬_Feedback-Welcome!-FF7F50?style=for-the-badge&logo=github&logoColor=white" alt="Feedback Badge" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/⚡_Tech_Stack-Next.js_+_Tailwind_+_Prisma_+_Socket.io_+_Gemini-DA70D6?style=for-the-badge&logo=stackshare&logoColor=white" alt="Tech Stack Badge" />
</p>

RentHub P2P is a cutting-edge peer-to-peer rental marketplace tailored for Uganda's vibrant real estate scene, with a focus on Kampala. Built for renters and property owners alike, it bridges the gap between traditional listings and modern, tech-driven experiences. Whether you're a student seeking affordable digs or a landlord optimizing occupancy, RentHub delivers seamless discovery, secure interactions, and innovative tools to make renting effortless and equitable.

[Live Demo](https://renthub-p2p.vercel.app/) | [API Documentation](https://renthub-docs.vercel.app/) | [Backend API](https://renthub-1-9tnm.onrender.com/api)

---

## 🌟 Why RentHub P2P?

In a market flooded with generic platforms, RentHub stands out by blending local insights with global tech. Imagine real-time chats that feel like a neighborhood conversation, AI that knows Kampala's rental quirks inside out, and a demo system that simulates mobile money flows without the hassle. We're not just another app—we're the future of P2P rentals in East Africa, designed to empower users with transparency, speed, and a touch of Ugandan flair.

---

## 🚀 Key Features

RentHub P2P packs a suite of intuitive features that prioritize user trust and efficiency:

- **Personalized Authentication**: Secure login with role-based access for renters (browse, book, chat) and owners (list, manage, monetize). JWT tokens ensure a tailored dashboard experience.
- **Mobile Money Payment Demo**: A realistic OTP-driven flow for MTN MoMo and Airtel Money simulations. No real funds move—focus on backend logic for OTP generation, expiration (TTL-based), and verification. Perfect for testing end-to-end security without financial risk.

- **24/7 AI Rental Assistant (Hub Scout)**: Powered by Google's Gemini 2.5 Flash, this draggable, resizable chat widget offers instant expertise on Uganda rentals. Ask about neighborhood vibes in Nakasero or generate compelling listing descriptions. It's always on, always contextual, and coded client-side for snappy performance.

- **Inline Real-Time Chat**: Powered by **Socket.io**, renters and owners connect instantly for negotiations, queries, or virtual walkthroughs. Messages sync across devices, with typing indicators and emoji support for a personal touch.

## 💡 Unique Differentiators: What Makes RentHub One-of-a-Kind

To elevate RentHub beyond the ordinary, we've infused features that resonate with Uganda's dynamic rental ecosystem. Here's how we stand out—and suggestions for future expansions:

| Feature                          | Description                                                                    | Why It's Unique                                                                     |
| :------------------------------- | :----------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| AI-Powered Local Expertise       | Gemini-tuned for Kampala specifics (e.g., matatu routes, flood-prone areas).   | No generic bots—Hub Scout feels like chatting with a local realtor, 24/7.           |
| P2P Trust Scoring                | Blockchain-inspired ledger for verified reviews and dispute resolution.        | Builds community trust without centralized gatekeepers.                             |
| AR Property Previews             | Scan your space with phone camera for instant 3D tours (upcoming).             | Renters "walk through" listings remotely—revolutionary for remote owners.           |
| Predictive Availability Calendar | ML-driven forecasts based on local events (e.g., Nyege Nyege Festival spikes). | Owners optimize pricing; renters snag deals before listings drop.                   |
| Eco-Rental Badges                | ESG scoring for solar-powered homes or green initiatives.                      | Appeals to sustainability-conscious millennials in Uganda's growing green movement. |
| Voice-Activated Search           | Luganda/English voice queries via Web Speech API.                              | Inclusive for low-literacy users, blending tech with cultural accessibility.        |
| Seamless Referral Network        | Reward renters/owners for referrals via airtime credits.                       | Turns users into advocates, fostering viral growth in tight-knit communities.       |

These additions position RentHub as the "one-in-a-lifetime" hub: hyper-local, tech-forward, and community-centric. Prioritize AR previews for your MVP v2—they'll wow investors.

## 🛠 Tech Stack

Our application is built using a modern, scalable, and efficient stack, following a full-stack JavaScript architecture.

### Frontend

| Component            | Technology                                                      | Purpose                                                                |
| :------------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Framework**        | **Next.js 13+** (App Router, Server Components)                 | High-performance React framework for rendering and routing.            |
| **State Management** | **TanStack Query** + React Query DevTools                       | Robust data fetching, caching, synchronization, and state management.  |
| **Styling**          | **TailwindCSS** (JIT mode, custom themes)                       | Utility-first CSS framework for rapid and consistent styling.          |
| **Real-Time**        | **Socket.io-client**                                            | Handling real-time communication for features like chat.               |
| **AI Integration**   | **Google Gemini 2.5 Flash API**                                 | Powering the AI-Enhanced Local Expertise features.                     |
| **UI Components**    | Heroicons, React Hot Toast, Custom Hooks (e.g., `useDraggable`) | Essential UI elements and reusable logic for a smooth user experience. |

---

### Backend

| Component     | Technology                                   | Purpose                                                                    |
| :------------ | :------------------------------------------- | :------------------------------------------------------------------------- |
| **Runtime**   | **Node.js + Express.js**                     | Fast, unopinionated, minimal web framework for the API server.             |
| **Database**  | **PostgreSQL** (via Prisma ORM)              | Reliable, open-source object-relational database for data persistence.     |
| **Auth**      | **JWT** + **bcrypt**                         | Secure user authentication and password hashing.                           |
| **Real-Time** | **Socket.io-server**                         | Enables bi-directional, low-latency communication with the client.         |
| **Payments**  | Mock Mobile Money (OTP via Nodemailer/Redis) | Simulated payment processing with secure, time-sensitive OTP verification. |
| **API Docs**  | **Swagger/OpenAPI** (auto-generated)         | Standardized, interactive documentation for all API endpoints.             |

### Deployment & Tools

- Frontend: Vercel (CI/CD with GitHub)
- Backend: Render.com (with auto-scaling)
- Monitoring: Sentry for errors, Vercel Analytics
- Testing: Jest + React Testing Library

---

## 📦 Quick Start

### Prerequisites

To run this project locally, ensure you have the following installed:

- **Node.js 18+**
- **PostgreSQL 14+** (local installation or running via Docker)
- **Yarn** or **npm** (we recommend Yarn)

---

### Installation

Follow these steps to set up and run the application.

#### 1. Clone the Repository

```bash
git clone [https://github.com/yourusername/renthub-p2p.git](https://github.com/yourusername/renthub-p2p.git)
cd renthub-p2p
```

## ⚙️ Environment Variables

The application requires the following environment variables to be set in the relevant `.env` files (e.g., `.env` for backend, `.env.local` for frontend).

| Key                  | Description                                                              | Example                                         |
| :------------------- | :----------------------------------------------------------------------- | :---------------------------------------------- |
| **`GEMINI_API_KEY`** | Google Gemini API key used for AI-powered features.                      | `your-gemini-key-12345`                         |
| **`DATABASE_URL`**   | PostgreSQL connection string for the database.                           | `postgresql://user:pass@localhost:5432/renthub` |
| **`JWT_SECRET`**     | Secret key used for signing JSON Web Tokens (JWT) for authentication.    | `supersecretkey`                                |
| **`REDIS_URL`**      | Connection string for the Redis server, used for OTP caching/expiration. | `redis://localhost:6379`                        |

## 🔄 Usage

This platform offers distinct experiences for renters and property owners, alongside a powerful AI assistant.

### For Renters 🏡

- **Sign Up:** Create an account to get started.
- **Browse Listings:** Explore properties using advanced filters and voice search.
- **Chat with Owners:** Initiate real-time, P2P conversations via the integrated chat feature.
- **Simulate Bookings:** Practice the booking process, verified securely via OTP (Mock Mobile Money).

### For Owners 🏢

- **Authenticate:** Log in and access your owner dashboard.
- **Upload Properties:** Easily list new properties with required details.
- **Use AI to Craft Descriptions:** Leverage **AI-Powered Local Expertise** to generate compelling, locally-tuned property descriptions.
- **Manage Inquiries:** Respond to renter questions in real-time through the chat interface.

### AI Widget 🤖

Look for the floating widget on the interface. Toggle it for instant, context-aware help.

**Try asking:** _"Best areas for families in Kampala?"_ or _"What are the matatu routes near this property?"_

### API Access 🌐

Developers can interact directly with the backend API.

For a full list of endpoints and schema definitions, please refer to the auto-generated **Swagger/OpenAPI docs**. Key endpoints include:

- `/auth/login`
- `/listings`
- `/chat/:roomId`
- `/ai/query`

## 🚀 Deployment

The architecture is designed for modern, scalable, and separate deployment of the frontend and backend services.

### Services Overview

- **Frontend (Next.js):**
  - **Method:** Push to GitHub branch $\rightarrow$ Automated deployment on **Vercel**.
- **Backend (Node/Express):**
  - **Method:** Use **Render's** dashboard or CLI. Link the GitHub repository for continuous integration and delivery (CI/CD).
- **Database (PostgreSQL):**
  - **Production Host:** We recommend managed services like **Supabase** or **Render Postgres**.

### Pro Tip 💡

To optimize the speed of AI-powered features globally, consider setting up **Vercel Edge Functions** to handle the Gemini API calls closer to the user.

## 🤝 Contributing

We warmly welcome contributions from the community! Whether it's code, documentation, or new feature ideas, your help is valuable.

### How to Contribute

1.  **Fork** the repository.
2.  Create a feature branch for your changes:
    ```bash
    git checkout -b feature/amazing-idea
    ```
3.  Commit your changes and **[submit a Pull Request (PR)](https://github.com/vanheaven-ui/renthub/pulls)** to the main repository.

### Focus Areas

We particularly appreciate contributions that focus on:

- Adding comprehensive **tests** (we aim for an 80% coverage goal).
- Updating the **API documentation** for any new or modified endpoints.
- Suggesting and implementing new **Uganda-specific features** (e.g., boda-boda integration for transport logistics).

Please review the full contribution guidelines in the **[CONTRIBUTING.md](./CONTRIBUTING.md)** file before submitting your PR.

---

### Found an Issue?

If you encounter a bug or have an idea for an enhancement, please **[open an issue](https://github.com/vanheaven-ui/renthub/issues)** and use the appropriate `enhancement` or `bug` label.

## 📄 License

This project is licensed under the **MIT License**.

For the full details and terms, please see the [MIT License](./LICENSE.md) file in the root of the repository.

## 🙏 Acknowledgments

This project was **Built with ❤️ for Uganda's rental community.**

A huge shoutout goes to the teams behind **TanStack**, **Tailwind CSS**, and **Google Gemini** for providing the powerful tools that make this application's magic possible.

⭐️ **Star us on GitHub** if RentHub sparks joy for you or your community!

---

## 🗓️ Get in Touch

**Last Updated:** October 24, 2025

Have questions or want to discuss a feature?

- Hit up the **[GitHub Discussions](https://github.com/vanheaven-ui/renthub/discussions)** page.
- Or email us directly at **vanheaven6@gmail.com**.

**Let us build the ultimate rental hub together!**
