# My Quote & Voting App - Backend

A RESTful API for a Quote & Voting application. It handles user authentication, quote management (CRUD), voting logic, and supports advanced query features. Built with NestJS and TypeScript.

## Features

- **User Authentication:**
  - User Registration (`POST /users/register`)
  - User Login (generates JWT bearer token) (`POST /auth/login`)
- **Quote Management (Protected Endpoints):**
  - Create Quote (`POST /quotes`)
  - Get All Quotes (`GET /quotes`)
  - Get Single Quote by ID (`GET /quotes/:id`)
  - Update Quote (`PATCH /quotes/:id`) - Only if quote has 0 votes
  - Delete Quote (`DELETE /quotes/:id`) - Only if quote has 0 votes
- **Voting Logic:**
  - Vote on a Quote (`POST /quotes/:id/vote`) - One vote per user per quote
- **Advanced Query Features for Quotes (`GET /quotes`):**
  - **Search:** Filter quotes by `content` or `author` using `?q=searchTerm`
  - **Filter:** Filter by `minVotes` and `maxVotes` using `?minVotes=X&maxVotes=Y`
  - **Sorting:** Sort by `votes`, `createdAt`, or `updatedAt` using `?sortBy=field&order=ASC|DESC` (Defaults: `createdAt` `DESC`)
  - Includes `hasVoted` flag per quote for the requesting user.
- **Security:** All API endpoints are authenticated using JWT Bearer Tokens.
- **Testing:** Comprehensive Unit Tests for services and Integration Tests for controllers.

## Technologies Used

- **Backend Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** TypeORM with SQLite (configured for in-memory for development)
- **Authentication:** JWT (JSON Web Tokens) with Passport.js
- **Password Hashing:** Bcrypt
- **Validation:** Class-validator
- **Testing:** Jest (Unit, Integration/E2E)
- **API Documentation (Optional):** Supports `@nestjs/swagger` decorators if installed.

## Getting Started

Follow these instructions to get the backend API running on your local machine.

### Prerequisites

- Node.js (LTS version recommended) & npm (or Yarn)
- Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/pusit-hanp/my-quote-app-backend
    cd my-quote-app-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

### Configuration

1.  Create a `.env` file in the root of the `my-quote-app-backend` directory:
    ```
    JWT_SECRET=yourStrongRandomSecretHere
    ```
    **IMPORTANT:** This secret should be a long, complex, and randomly generated string in a production environment. Do NOT commit your `.env` file to version control.

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run start:dev
    ```
2.  The API will be available at `http://localhost:3000`.

### Running Tests

To run the backend unit and integration tests:

```bash
npm run test
```
