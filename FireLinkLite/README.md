# FireLink Lite - Emergency Alert System

A community-based emergency alert Progressive Web App (PWA) with real-time notifications, WebRTC voice calls, and geographic proximity-based panic alerts. Inspired by Lumkani's community fire alert system.

## 🚨 Features

### Core Emergency Features
- **One-tap SOS Button**: Instantly send emergency alerts with GPS location
- **Community Alerts**: Real-time notifications to nearby users within 200m radius
- **Panic Ringtone**: Automatic audio alerts on nearby devices when emergencies occur
- **WebRTC Voice Calls**: Direct voice communication between users and EMS agents
- **Agent Dashboard**: Emergency management interface for EMS personnel
- **Callback System**: Schedule and manage follow-up calls

### Technical Features
- **Progressive Web App (PWA)**: Installable, works offline, push notifications
- **Real-time Communication**: WebSocket-based instant updates
- **Geolocation-based**: Haversine distance calculation for proximity alerts
- **Responsive Design**: Mobile-first interface using Tailwind CSS
- **Audio Permissions**: Browser autoplay policy compliance
- **Authentication**: JWT-based agent authentication

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for state management
- **WebRTC APIs** for peer-to-peer communication
- **Leaflet.js** for mapping
- **Service Worker** for PWA functionality

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **SQLite** (development) / PostgreSQL (production)
- **WebRTC Signaling Server**
- **JWT Authentication**
- **Web Push Notifications (VAPID)**
- **bcrypt** for password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd firelink-lite
