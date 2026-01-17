# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# ⚛️ React-Spring-AI Frontend

This repository contains the **React frontend** built with **Vite** and designed to interact with the Spring Boot AI backend. It provides a modern, responsive user interface for accessing the synchronous and streaming chat APIs.

---

## 📦 Prerequisites

Before starting the frontend, ensure you meet these requirements:

* **Node.js 18+**
* **NPM 9+** (or use Yarn / PNPM)
* **Backend running** and accessible at the default address:
    ```
    http://localhost:8080
    ```

---

## 🛠 Setup & Running

Follow these steps to get the development server running:

### 1. **Clone the repository**

```bash
git clone [https://github.com/VaibhavsCoding/react-spring-ai-frontend.git](https://github.com/VaibhavsCoding/react-spring-ai-frontend.git)
cd react-spring-ai-frontend
```

### 2. Install dependencies
````bash
npm install
````

### 3. Start the development server
````bash
npm run dev
````


### 🔌 Access the Application

The frontend will start running on the following address:
````
http://localhost:5173
````

Note: Make sure your Spring Boot backend is running before sending any chat prompts.

## ⚙️ Environment Configuration

To configure the backend URL, create a file named .env in the project root:

Code snippet
````
VITE_BACKEND_URL=http://localhost:8080
````

The application will automatically use this `VITE_BACKEND_URL` value for all API calls.

## ✨ Implemented Features

* Modern UI built using React + Vite.
* Chat UI for intuitive AI conversation.
* API integration with the Spring Boot backend (synchronous and streaming).
* Loading indicators and smooth user experience (UX).
* Animated input box (RGB border).
* Fully mobile-responsive layout.


## 💻 Project Commands

| Command       | Description |
|:--------------| :--- |
| `npm run build` | Build the optimized production bundle (into the `dist` folder). |
| `npm run preview` | Preview the production build locally (after running npm run build). |

## 📂 Folder Structure
````
react-spring-ai-frontend/
├── src/
│   ├─ auth/
│   │   ├─ AuthContext.jsx
│   │   ├─ ProtectedRoute.jsx
│   ├─ pages/
│   │   ├─ Login.jsx
│   │   
│   ├── components/
│   │   └── ChatBot.jsx       # Main component handling chat logic and rendering
│   ├── assets/               # Static files and images
│   ├── App.jsx               # Main application component
│   └── main.jsx              # Entry point for React rendering
├── public/                   # Files served directly
├── index.html                # Main HTML file
├── package.json
└── vite.config.js            # Vite configuration
````

## 💬 How to Test Chat Functionality

1. **Start the backend** (`mvn spring-boot:run`).
2. **Start the frontend** (`npm run dev`).
3. Open your browser to:
````
http://localhost:5173
````

4. Type any message into the chat input, and the AI response will appear instantly.

**Backend Repository Link:**
[https://github.com/VaibhavsCoding/react-spring-ai-backend.git](https://github.com/VaibhavsCoding/react-spring-ai-backend.git)