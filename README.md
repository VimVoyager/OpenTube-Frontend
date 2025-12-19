# OpenTube Frontend

Modern, privacy-focused YouTube client built with SvelteKit, featuring adaptive video streaming,
comprehensive search, and clean, responsive interface

## Purpose

OpenTube Frontend provides privacy respecting alternative to the standard YouTube interface with

 1. **No Tracking** - Zero analytics, no cookies, complete privacy
 2. **Adaptive Streaming** - DASH video playback with quality selection
 3. **Modern UI** - Clean, responsive design with SvelteKit
 4. **Fast Performance** - Server-side rendering and optmized loading
 4. **Full Features** - Search, video playback, related videos, metadata

## Architecture Overview



## Three-Layer Architecture



## Data Flow Diagrams




## Key Features



## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm 9+**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/OpenTube-Frontend.git
cd OpenTube-Frontend

# Install dependencies
npm install
```

### Configuration

Create `.env.development`:

```bash
# Backend API URL
PUBLIC_API_URL=http://localhost:8080

# Stream Proxy URL (if different from API)
PUBLIC_PROXY_URL=http://localhost:8081

# App Configuration
PUBLIC_APP_NAME=OpenTube
```

Create `.env.production`:

```bash
# Production API URL
PUBLIC_API_URL=https://api.yourdomain.com

# Production Proxy URL
PUBLIC_PROXY_URL=https://proxy.yourdomain.com

PUBLIC_APP_NAME=OpenTube
```

### Running the Application

#### Development Mode

```bash
# Start development server
npm run dev

# Access at http://localhost:5173

# With host flag (for network access)
npm run dev -- --host
```

#### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Or deploy the 'build' directory
```

## Testing

### Run All Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Run Specific Tests

```bash
# Test single file
npm test -- src/lib/adapters/search.test.ts

# Test pattern
npm test -- --grep "search adapter"
```

## Technologies Used

| Technology | Purpose | Version |
|-----------|---------|---------|
| SvelteKit | Framework | 2.x |
| Svelte | UI Library | 5.x |
| TypeScript | Language | 5.x |
| Shaka Player | Video Player | 4.x |
| Vite | Build Tool | 5.x |
| Vitest | Testing | 1.x |
| Playwright | E2E Testing | 1.x |
