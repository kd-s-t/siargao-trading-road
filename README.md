<div align="center"> 
	<img src="./logo.png" width="100%" /> 
</div>

# Siargao Trading Road

Wholesale marketplace app connecting suppliers and stores in Siargao.

<div align="center"> 
	<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" /> 
	<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" /> 
	<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /> 
</div>

---

## Features

- **Supplier Management**: Register, add products via Excel/JSON/manual entry
- **Store Management**: Register, browse suppliers, purchase wholesale
- **Product Management**: Full CRUD operations with soft delete and restore
- **Authentication**: JWT-based secure authentication system
- **Multi-Platform**: React Native mobile app (suppliers & stores) and Next.js web admin panel (admin only)

## Quick Start

### Backend (Golang API)

```bash
cd golang
go run main.go
```

Server runs on port **3020**. See [golang/README.md](./golang/README.md) for details.

### Frontend (Next.js Admin Panel)

**Prerequisites:**
- Node.js 18+
- Backend API running on `http://localhost:3020`

**Setup and Run:**
```bash
cd nextjs
npm install
npm run dev
```

Admin panel runs on port **3021** at `http://localhost:3021`.

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

For detailed setup, environment variables, and more information, see [nextjs/README.md](./nextjs/README.md).

## Project Structure

```
siargaotradingroad/
├── reactnative/    # React Native mobile app
├── golang/         # Golang REST API
├── nextjs/         # Next.js admin panel
├── postman/        # Postman API collection
├── infrastructure/ # Infrastructure as Code
└── docs/           # Documentation
```

## User Types

- **Supplier**: Register, add items (Excel/JSON/manual)
- **Store**: Register, select supplier, buy wholesale
- **Admin**: Manage users, products, orders via web panel

## Documentation

- [Backend API](./golang/README.md) - Golang API setup and testing
- [Admin Panel](./nextjs/README.md) - Next.js admin panel setup
- [Tech Stack](./docs/TECH_STACK.md) - Technology stack details
