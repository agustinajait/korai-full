# KORAI - Social Survey Application

## Overview

KORAI is a gamified social survey platform designed to collect community welfare data across multiple dimensions (health, education, work, housing, social security, and culture). The application uses a "traffic light" response system (green/yellow/red) to gauge citizens' perceptions of their living conditions. Results are aggregated into a dashboard for visualization and analysis.

The platform is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, localStorage for survey context
- **Styling**: Tailwind CSS with CSS variables for theming, dark mode by default
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Special Effects**: canvas-confetti for celebration effects on survey completion

**Key Pages**:
- `/` - Welcome page with city/neighborhood selection
- `/survey` - Interactive survey with traffic light responses
- `/dashboard` - Analytics visualization of aggregated responses

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Vite for frontend, esbuild for backend bundling

**API Endpoints**:
- `POST /api/reports` - Submit survey responses
- `GET /api/reports` - List reports with optional filters
- `GET /api/stats` - Get aggregated statistics

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Main Entity**: `reports` table storing survey answers as JSONB, with city, neighborhood, demographics, and optional open text feedback

### Shared Code Pattern
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Database schema and Zod validation schemas
- `routes.ts` - API route definitions with input/output types

### Development vs Production
- Development: Vite dev server with HMR proxied through Express
- Production: Static file serving from `dist/public`, bundled server in `dist/index.cjs`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema migrations stored in `/migrations`

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library
- **canvas-confetti**: Celebration effects
- **recharts**: Dashboard chart visualization
- **Radix UI**: Accessible component primitives (dialog, select, progress, tooltip, etc.)

### Backend Libraries
- **express**: HTTP server framework
- **drizzle-orm**: Database ORM
- **zod**: Schema validation for API inputs
- **connect-pg-simple**: PostgreSQL session store (available but sessions not currently used)

### Build Tools
- **Vite**: Frontend build and dev server
- **esbuild**: Backend bundling for production
- **tsx**: TypeScript execution for development

### Fonts
- DM Sans (body text)
- Outfit (display/headings)
- Loaded via Google Fonts CDN