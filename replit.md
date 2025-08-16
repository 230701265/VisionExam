# Overview

AccessExam is a comprehensive accessibility-focused exam management system built as a full-stack web application. The system enables instructors to create and manage exams while providing students with an accessible exam-taking experience. The application emphasizes WCAG compliance, keyboard navigation, screen reader compatibility, and customizable accessibility features including text-to-speech, adjustable font sizes, and high contrast modes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Components**: Radix UI primitives with shadcn/ui component system for accessible, customizable components
- **Styling**: Tailwind CSS with CSS custom properties for theming and accessibility
- **State Management**: TanStack Query for server state management with custom query client
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Data Layer**: Abstracted storage interface supporting both in-memory and database implementations
- **Development**: Hot module replacement via Vite integration in development mode

## Accessibility Framework
- **Provider Pattern**: Centralized AccessibilityProvider managing user preferences and TTS capabilities
- **Keyboard Navigation**: Custom hooks for keyboard shortcuts and screen reader announcements
- **Text-to-Speech**: Browser-native Speech Synthesis API integration with configurable rates and volumes
- **ARIA Support**: Comprehensive ARIA labels, landmarks, and live regions for screen reader compatibility

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for cloud database hosting
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Development Storage**: In-memory storage implementation for development and testing

## Authentication & Authorization
- **Authentication**: Simple username/password authentication with session-based user management
- **Authorization**: Role-based access control (student, instructor, admin)
- **User Management**: User registration, login, and profile management with default accessibility settings

## External Dependencies

- **Database**: Neon serverless PostgreSQL for production data storage
- **UI Framework**: Radix UI for accessible component primitives
- **Form Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Development**: Replit-specific plugins for development environment integration
- **Build Tools**: Vite with esbuild for fast development and optimized production builds
- **Styling**: Tailwind CSS with PostCSS for utility-first styling approach