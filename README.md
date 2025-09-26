# Privacy-Preserving Online Ebook Sale Platform (Frontend)

This is a feature-rich frontend application that simulates a modern online bookstore. The project not only provides a seamless user experience—including user authentication, book browsing, searching, and payments—but also implements cutting-edge privacy-preserving technologies to ensure user anonymity and security throughout the purchasing and downloading process.

## ✨ Core Features

* **User Authentication**: Complete registration and login flows with session management handled by JSON Web Tokens (JWT).
* **Book Browsing & Searching**:
    * An **infinite scroll** implementation on the homepage to display all available books.
    * A powerful **fuzzy-search** feature allowing users to search by title or author, with results also supporting infinite scroll.
* **Secure Payment Flow**: Integration with the Stripe payment gateway for a secure and smooth credit card payment experience.
* **Privacy-Preserving Downloads (Core Technology)**:
    * **Zero-Knowledge Proofs (ZKP)**: After a purchase, the client generates a zero-knowledge proof (based on `snarkjs` and `circomlibjs`) to prove to the server that it has the right to download a book **without revealing which specific book was purchased**. This protects the user's purchasing privacy.
    * **Oblivious Transfer (OT)**: Once the ZKP is verified, the client and server engage in an Oblivious Transfer protocol to securely exchange cryptographic keys. This allows the client to obtain the decryption key for the specific book they bought, while the server **never learns which key the client requested**, further protecting user privacy.
* **Responsive & Modern UI**:
    * Built with the **Material-UI (MUI)** component library for a beautiful and responsive interface that works well across all devices.
    * All pages and components are thoughtfully designed to provide a fluid, Amazon-like shopping experience.

## 🛠️ Tech Stack

* **Framework**: React
* **UI Library**: Material-UI (MUI)
* **State Management**: Zustand
* **Routing**: React Router
* **Data Fetching & Caching**: TanStack Query (React Query)
* **Payment Integration**: Stripe.js
* **Core Cryptography Libraries**:
    * `snarkjs`: For generating and verifying Groth16 ZK-SNARKs.
    * `circomlibjs`: Provides cryptographic primitives like the Poseidon hash for ZKP circuits.
    * `@noble/curves`: Used for the Elliptic Curve Cryptography operations in the Oblivious Transfer protocol.
* **Real-time Communication**: WebSocket
* **Build Tool**: Vite

## 🚀 Installation & Setup

Before you begin, ensure you have Node.js and npm installed.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/Zeyu-Ziyi/Privacy-Preserving-Online-Ebook-Sale-Platform-front-end]
    cd [YOUR_PROJECT_DIRECTORY]
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**

    You need to create a `.env` file to store sensitive information like Stripe public key.
    ```
    VITE_STRIPE_PUBLIC_KEY=pk_test_...
    ```

4.  **Run the Project**
    ```bash
    npm run dev
    ```
    The project should now be running on `http://localhost:5173` (or another port specified by Vite).

## 🧪 Running Automated Tests

This project is configured with **Vitest** and **React Testing Library** for automated testing, ensuring the stability of core cryptographic logic and UI components.

* **Run All Tests**:
    ```bash
    npm test
    ```

* **Generate a Coverage Report**:
    ```bash
    npm run coverage
    ```
    Test files are located in the `src/lib` and `src/components` directories, ending with `.test.js` or `.test.jsx`.

## 📁 Project Structure Overview
