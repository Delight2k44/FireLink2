# FireLink Lite - Emergency Alert System

## Overview

FireLink Lite is a community-based emergency alert Progressive Web App (PWA) that provides real-time emergency notifications, WebRTC voice calls, and geographic proximity-based panic alerts. The system enables users to send one-tap SOS alerts that notify nearby community members within a 200-meter radius, while also alerting emergency management service (EMS) agents. The application implements panic ringtones, voice communication capabilities, and a comprehensive agent dashboard for emergency response coordination.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Component-based UI with type safety
- **Progressive Web App (PWA)**: Installable application with offline capabilities and push notifications
- **Tailwind CSS**: Utility-first styling framework for responsive design
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **Radix UI Components**: Accessible, unstyled UI primitives with shadcn/ui integration

### Backend Architecture
- **Node.js with Express**: RESTful API server
- **WebSocket Communication**: Real-time bidirectional communication using WebSocket protocol
- **Authentication System**: JWT-based authentication with bcrypt password hashing
- **Geographic Calculations**: Haversine formula implementation for proximity-based alert distribution
- **WebRTC Signaling**: Peer-to-peer voice communication setup and management

### Database Design
- **SQLite Development**: File-based database for local development
- **PostgreSQL Production**: Configured via Drizzle ORM for production deployment
- **Schema Structure**: 
  - Users table for authentication (agents and community members)
  - Alerts table for emergency incidents with geolocation data
  - Callback requests for scheduled follow-up communications
  - Community responses for tracking emergency response participation
  - Push subscriptions for web push notification management

### Real-time Communication
- **WebSocket Server**: Custom implementation for instant emergency alerts
- **Client Registration**: Location-based client tracking for proximity alerts
- **Event Broadcasting**: Selective message distribution based on geographic proximity and user roles
- **Connection Management**: Automatic reconnection and error handling

### Geolocation System
- **Browser Geolocation API**: Primary location detection method
- **Manual Location Entry**: Fallback for cases where GPS is unavailable
- **Proximity Calculations**: 200-meter radius determination using Haversine distance formula
- **Location Privacy**: Client-side location storage with server-side distance calculations

### Audio System
- **Panic Ringtone**: Emergency alert sound system with browser autoplay policy compliance
- **User Gesture Requirement**: Audio permission system requiring user interaction
- **Audio Context Management**: Web Audio API integration for reliable audio playback

### WebRTC Implementation
- **Peer-to-Peer Communication**: Direct voice calls between users and EMS agents
- **Signaling Server**: Custom WebSocket-based signaling for connection establishment
- **ICE Servers**: STUN server configuration for NAT traversal
- **Media Stream Management**: Audio capture and playback handling

### Service Worker Integration
- **Offline Functionality**: Critical assets cached for offline emergency access
- **Push Notifications**: Web Push API implementation with VAPID keys
- **Background Sync**: Queued emergency alerts for offline scenarios
- **Cache Management**: Strategic caching of emergency-critical resources

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity for production
- **drizzle-orm**: Type-safe database ORM with migration support
- **better-sqlite3**: SQLite database driver for development
- **web-push**: Server-side web push notification implementation
- **socket.io**: Enhanced WebSocket communication (if implemented)

### UI and Styling
- **@radix-ui/***: Comprehensive accessible UI component library
- **tailwindcss**: CSS framework for responsive design
- **class-variance-authority**: Type-safe component variant management
- **lucide-react**: Icon library for consistent iconography

### Development and Build Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: JavaScript bundler for production builds
- **typescript**: Type checking and compilation

### Authentication and Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and verification

### API and Data Management
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation integration
- **zod**: Runtime type validation for API requests

### Geographic and Mapping
- **Leaflet.js**: Interactive mapping (loaded via CDN)
- **OpenStreetMap**: Map tile provider for location visualization

### Browser APIs
- **WebRTC APIs**: Peer-to-peer communication
- **Geolocation API**: Location detection
- **Web Audio API**: Audio playback control
- **Service Worker API**: PWA functionality
- **Web Push API**: Push notification delivery
- **WebSocket API**: Real-time communication