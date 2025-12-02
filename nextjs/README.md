# Next.js Admin Panel

Web admin interface for managing Siargao Trading Road.

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3021`.

## Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3020`

## Environment Variables

Create `.env.local` (optional):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3020/api
```

Defaults to `http://localhost:3020/api` if not set.

## Scripts

- `npm run dev` - Start development server (port 3021)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run storybook` - Start Storybook (port 2022)
- `npm run build-storybook` - Build static Storybook

## Default Admin Credentials

- Email: `admin@example.com`
- Password: `admin123`

## Pages

- `/` - Landing page
- `/login` - Admin login
- `/dashboard` - Analytics dashboard
- `/users` - User management
- `/products` - Product management
- `/orders` - Order management

## Storybook

This project uses Storybook for component development and testing.

### Running Storybook

```bash
npm run storybook
```

Storybook runs on port **2022** at `http://localhost:2022`.

### Available Component Stories

- **Buttons** - All variants (contained, outlined, text), sizes, states, with icons, login buttons
- **Headers** - Admin, Store, Supplier headers with different colors, landing page header
- **Logo** - Different sizes and background contexts
- **Tables** - Products table, orders table, dashboard orders table, empty states
- **Navigation** - Admin, Store, and Supplier navigation drawers

### Creating New Stories

Stories are located in the `components/` directory with the pattern `ComponentName.stories.tsx`.

Example:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import MyComponent from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {};
```

## Tech Stack

- Next.js 16.0.1 (App Router)
- Material-UI v7.3.5
- TypeScript
- Framer Motion
- Chart.js
- Storybook 8.6.14
