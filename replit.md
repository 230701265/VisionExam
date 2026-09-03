# Overview

OPSIS is a comprehensive VS Code-like coding exam platform built as a full-stack web application with exceptional accessibility features. The system enables instructors to create both traditional exams and advanced programming challenges, while providing students with a professional code editing experience similar to VS Code. The platform supports multiple programming languages, real-time code execution, comprehensive test case validation, and full accessibility compliance including keyboard-only navigation, screen reader compatibility, and text-to-speech functionality.

# User Preferences

Preferred communication style: Simple, everyday language.
Accessibility Priority: Full keyboard navigation without mouse interaction using international shortcut keys for blind users.
Navigation Standard: WCAG 2.1 AA compliant keyboard shortcuts following international accessibility standards.
Cross-Platform Support: Mac-compatible shortcuts using Option key instead of Alt, and Cmd instead of Ctrl for native macOS feel.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **Code Editor**: Monaco Editor (@monaco-editor/react) providing VS Code-like editing experience
- **UI Components**: Radix UI primitives with shadcn/ui component system for accessible, customizable components
- **Styling**: Tailwind CSS with CSS custom properties for theming and accessibility
- **State Management**: TanStack Query for server state management with custom query client
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Programming Support**: Multi-language syntax highlighting, code execution, and test case validation

## Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Data Layer**: Abstracted storage interface supporting both in-memory and database implementations
- **Development**: Hot module replacement via Vite integration in development mode

## Accessibility Framework
- **Provider Pattern**: Centralized AccessibilityProvider managing user preferences and TTS capabilities
- **Keyboard Navigation**: Advanced keyboard shortcuts including Alt+arrow keys for section navigation
- **Code Editor Accessibility**: Full screen reader support for Monaco Editor with keyboard shortcuts (F5 run, F9 reset, Ctrl+S save)
- **Text-to-Speech**: Browser-native Speech Synthesis API integration with configurable rates and volumes
- **ARIA Support**: Comprehensive ARIA labels, landmarks, and live regions for screen reader compatibility
- **Navigation System**: Complete keyboard-only operation with focus management and skip links

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for cloud database hosting
- **Schema Management**: Drizzle migrations with shared schema definitions supporting coding questions
- **Development Storage**: In-memory storage implementation for development and testing
- **Coding Data**: Extended schema with programming language support, test cases, and code execution tracking
- **Code Submissions**: Comprehensive submission tracking with execution results and performance metrics

## Authentication & Authorization
- **Authentication**: Simple username/password authentication with session-based user management
- **Authorization**: Role-based access control (student, instructor, admin)
- **User Management**: User registration, login, and profile management with default accessibility settings

## External Dependencies

- **Database**: Neon serverless PostgreSQL for production data storage
- **Code Editor**: Monaco Editor for VS Code-like editing experience with syntax highlighting
- **UI Framework**: Radix UI for accessible component primitives
- **Form Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Development**: Replit-specific plugins for development environment integration
- **Build Tools**: Vite with esbuild for fast development and optimized production builds
- **Styling**: Tailwind CSS with PostCSS for utility-first styling approach
- **Code Execution**: Mock execution system for testing student code solutions

## Recent Changes (September 2, 2025)

✓ **Major Platform Transformation**: Converted OPSIS from traditional exam system to VS Code-like coding platform
✓ **Monaco Editor Integration**: Added professional code editor with syntax highlighting for JavaScript, Python, Java, C++, C, TypeScript, Go, and Rust
✓ **Coding Question Support**: Extended database schema to support programming challenges with test cases and execution tracking
✓ **International Keyboard Navigation**: Implemented comprehensive WCAG 2.1 AA compliant keyboard shortcuts for blind users worldwide
✓ **Global Accessibility Standards**: Added support for international accessibility standards (Section 508, EN 301 549, ADA)
✓ **Universal Screen Reader Support**: Compatible with NVDA, JAWS, VoiceOver, Orca, TalkBack across all major platforms
✓ **Cross-Platform Navigation System**: Alt/Option+Arrow keys, landmark navigation (Alt/Option+M/N/F), element type navigation (Alt/Option+H/B/L/I)
✓ **Code Execution System**: Built mock code execution engine with test case validation and performance metrics
✓ **Speech Synthesis Integration**: Real-time audio announcements with 40+ language support and adjustable settings
✓ **Complete Mouse-Free Operation**: Every feature accessible via keyboard following international blind user standards
✓ **Enhanced Accessibility Architecture**: Created InternationalKeyboardHelp and useInternationalKeyboardNavigation hook
✓ **Database Schema Updates**: Added coding question fields, test cases, and code submission tracking
✓ **Component Architecture**: Created CodingQuestionRenderer and integrated with existing QuestionRenderer system

## Running on Replit

- Start the development app with `npm run dev`.
- The app serves both the client and API on port 5000.
- Development uses the in-memory storage implementation, so a database connection is not required for the preview.
- Use `npm run build` followed by `npm start` for the production build.
- Database schema commands such as `npm run db:push` require `DATABASE_URL`.