# Tech Stack - Siargao Trading Road

## Frontend (Web)
- **Next.js** 16.0.1 (App Router)
- **React** 19.2.0
- **TypeScript**
- **Material-UI (MUI)** v7.3.5
- **Tailwind CSS** v4
- **Axios** for API calls
- **Emotion** (styling engine for MUI)
- **Storybook** 8.6.14 (component development and documentation)

## Frontend (Mobile)
- **React Native** (Expo recommended)
- **React Native Paper** (Material Design for React Native)
- **React Navigation**
- **React Query / SWR** for data fetching

## Backend
- **Golang** 1.21
- **Gin** framework
- **golang-jwt/jwt/v5** for JWT authentication
- **GORM** with PostgreSQL driver
- **golang.org/x/crypto/bcrypt** for password hashing
- **joho/godotenv** for configuration
- Built-in **multipart/form-data** for file uploads (Excel/JSON)
- **Gin binding** for request validation
- **REST API**

## Database
- **PostgreSQL** (relational data: suppliers, stores, products, orders, transactions)
- **Redis** (optional, for caching/sessions)

## Infrastructure
- **AWS EC2**
- **Terraform**
- **GitHub Actions**
- **S3** for file storage (Excel/JSON uploads)
- **RDS** for PostgreSQL (or install on EC2)

## App Overview
- **2 User Types:**
  - **Supplier**: Register, add items (Excel/JSON/manual)
  - **Store**: Register, select supplier, buy wholesale

