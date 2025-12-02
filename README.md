<div align="center"> 
	<img src="./logo.png" width="100%" /> 
</div>

# Siargao Trading Road

Siargao Trading Road marketplace app connecting suppliers and stores in Siargao.

<div align="center"> 
	<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" /> 
	<img src="https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white" /> 
	<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> 
	<br />
	<img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" /> 
	<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /> 
	<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" /> 
	<img src="https://img.shields.io/badge/API-FF6F00?style=for-the-badge&logo=fastapi&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white" /> 
	<br />
	<img src="https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white" /> 
	<img src="https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" /> 
	<img src="https://img.shields.io/badge/React%20Navigation-61DAFB?style=for-the-badge&logo=react&logoColor=black" /> 
	<img src="https://img.shields.io/badge/React%20Native%20Paper-6366F1?style=for-the-badge&logo=react&logoColor=white" /> 
	<br />
	<img src="https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /> 
	<img src="https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" /> 
</div>

---

## Visual Overview

<div align="center">
  <h3>Landing Page</h3>
  <img src="./landingpage.png" alt="Siargao Trading Road Landing Page" width="100%" />
  
  <h3>Mobile App - Login Screen</h3>
  <img src="./login.png" alt="Mobile App Login Screen" width="100%" />
</div>

---

## Features

- **Supplier Management**: Register, add products via Excel/JSON/manual entry
- **Store Management**: Register, browse suppliers, purchase products
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

**Storybook (Component Development):**
```bash
cd nextjs
npm run storybook
```

Storybook runs on port **2022** at `http://localhost:2022`.

For detailed setup, environment variables, and more information, see [nextjs/README.md](./nextjs/README.md).

### Mobile App (React Native)

**Prerequisites:**
- Node.js 18+
- Expo CLI (installed globally or via npx)
- Backend API running on `http://localhost:3020`
- iOS Simulator (for macOS) or Android Emulator / physical device

**Setup and Run:**
```bash
cd reactnative
npm install
npm start
```

For Android, use `npx expo run:android`. These commands build and run a development build on the simulator/emulator.

Alternatively, you can use `npm start` or `npx expo start` to launch the Expo dev server, then press `i` for iOS or `a` for Android, or scan the QR code with Expo Go app on your physical device.

For detailed setup, environment variables, building, and deployment, see [reactnative/README.md](./reactnative/README.md).

## Project Structure

```
siargaotradingroad/
├── reactnative/    # React Native mobile app
├── golang/         # Golang REST API
├── nextjs/         # Next.js admin panel
│   └── .storybook/  # Storybook configuration
├── postman/        # Postman API collection
├── infrastructure/ # Infrastructure as Code
└── docs/           # Documentation
```

## User Types

- **Supplier**: Register, add items (Excel/JSON/manual)
- **Store**: Register, select supplier, buy products
- **Admin**: Manage users, products, orders via web panel

## Storybook

This project uses [Storybook](https://storybook.js.org/) for component development and documentation.

### Next.js Storybook (Web Components)

View and test web components built with Material-UI:

```bash
cd nextjs
npm run storybook
```

Access at `http://localhost:2022`

<div align="center">
  <img src="./storybook.png" alt="Storybook Component Library" width="100%" />
</div>

**Available Stories:**
- Buttons (variants, sizes, states, with icons)
- Headers (Admin, Store, Supplier, Landing page)
- Logo (different sizes and backgrounds)
- Tables (Products, Orders, Dashboard)
- Navigation (Admin, Store, Supplier drawers)

## Documentation

- [Backend API](./golang/README.md) - Golang API setup and testing
- [Admin Panel](./nextjs/README.md) - Next.js admin panel setup
- [Mobile App](./reactnative/README.md) - React Native mobile app setup and deployment
- [Tech Stack](./docs/TECH_STACK.md) - Technology stack details
