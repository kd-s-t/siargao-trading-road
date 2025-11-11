# Siargao Trading Road

Wholesale marketplace app connecting suppliers and stores in Siargao.

<div align="center"> 
	<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" /> 
	<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white" /> 
	<img src="https://img.shields.io/badge/React%20Native%20Paper-6200EE?style=for-the-badge&logo=react&logoColor=white" /> 
</div>

<div align="center"> 
	<img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" /> 
	<img src="https://img.shields.io/badge/Gin-009639?style=for-the-badge&logo=gin&logoColor=white" /> 
	<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /> 
	<img src="https://img.shields.io/badge/AWS%20RDS-527FFF?style=for-the-badge&logo=amazon-rds&logoColor=white" /> 
	<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" /> 
</div>

<div align="center"> 
	<img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" /> 
	<img src="https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white" /> 
	<img src="https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white" />
</div>

---

## Features

- **Supplier Management**: Register, add products via Excel/JSON/manual entry
- **Store Management**: Register, browse suppliers, purchase wholesale
- **Product Management**: Full CRUD operations with soft delete and restore
- **Authentication**: JWT-based secure authentication system
- **Multi-Platform**: React Native mobile app and Next.js web admin panel
- **RESTful API**: Golang backend with Gin framework

---

## Project Structure

```
siargaotradingroad/
├── mobile/               # React Native mobile app (Expo, Android APK)
├── go/                   # Golang REST API (Gin, PostgreSQL, JWT auth)
│   ├── handlers/         # API endpoints
│   ├── models/           # Database models
│   ├── middleware/       # Auth & validation middleware
│   ├── config/           # Configuration
│   └── database/         # DB connection
├── web/                  # Next.js admin panel (MUI5, TypeScript)
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # API client & utilities
│   └── contexts/         # React contexts
├── infrastructure/       # Infrastructure as Code
│   ├── terraform/        # AWS EC2 provisioning
│   └── github-actions/   # CI/CD workflows
└── docs/                 # Documentation
```

## User Types

- **Supplier**: Register, add items (Excel/JSON/manual)
- **Store**: Register, select supplier, buy wholesale

## Tech Stack

See [docs/TECH_STACK.md](./docs/TECH_STACK.md)

