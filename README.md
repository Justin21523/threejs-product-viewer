# 🎯 3D Product Viewer Pro

> Enterprise-grade 3D product viewer built with Three.js

A modern, performant, and feature-rich 3D product visualization platform designed for e-commerce, portfolio showcases, and commercial demonstrations.

## ✨ Features

### Core Features (MVP)
- 🎨 **Interactive 3D Visualization** - Smooth model loading and rendering
- 🎮 **Intuitive Controls** - Mouse, touch, and keyboard interactions
- 📱 **Responsive Design** - Perfect on desktop, tablet, and mobile
- ⚡ **Performance Optimized** - 60fps on desktop, 30fps on mobile
- 🎭 **Material System** - Dynamic material switching and presets
- 💡 **Advanced Lighting** - Multiple light sources with dynamic adjustment

### Advanced Features (Planned)
- 🎬 **Animation System** - Model animations with timeline controls
- 🏷️ **Annotation System** - 3D hotspots and product information
- 🛠️ **Product Configurator** - Real-time customization and variants
- 📸 **Screenshot & Sharing** - High-quality captures and social sharing
- 🥽 **AR Support** - WebXR and mobile AR preview
- 📊 **Analytics Integration** - User behavior tracking and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm 8+ or yarn
- Modern browser with WebGL support

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/3d-product-viewer-pro.git
cd 3d-product-viewer-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

```javascript
import { ProductViewer } from '@core/viewer.js';

// Initialize viewer
const viewer = new ProductViewer({
  container: document.getElementById('viewer-container'),
  debug: true
});

await viewer.init();

// Load a model
await viewer.loadModel('/assets/models/product.glb');
```

## 🏗️ Architecture

### Project Structure
```
src/
├── core/           # Core 3D engine modules
├── controls/       # User interaction controllers
├── ui/            # User interface components
├── features/      # Advanced feature modules
├── utils/         # Utility functions
├── services/      # External service integrations
└── styles/        # CSS stylesheets
```

### Core Modules
- **Viewer** - Main application class
- **SceneManager** - 3D scene management
- **ModelManager** - Model loading and optimization
- **MaterialManager** - Material and texture system
- **CameraManager** - Camera controls and animations
- **LightingManager** - Dynamic lighting system

## 📋 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

### Code Standards
- **Language**: English for all code, comments, and documentation
- **Style**: ESLint + Prettier for consistent formatting
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Git**: Conventional commits with Git Flow workflow

### Performance Targets
| Metric | Desktop | Mobile |
|--------|---------|--------|
| FPS | 60fps | 30fps |
| Memory | <500MB | <200MB |
| Load Time | <3s | <5s |

## 🛠️ Technology Stack

- **3D Engine**: Three.js r150+
- **Build Tool**: Vite
- **Language**: Modern JavaScript (ES2022)
- **Testing**: Vitest + Playwright
- **Styling**: CSS3 + CSS Grid/Flexbox
- **Dev Tools**: ESLint, Prettier, Husky

## 📖 Documentation

- [Development Guide](docs/DEVELOPMENT.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

## 🎯 Roadmap

### Phase 1: MVP (Weeks 1-6)
- [x] Project setup and core architecture
- [ ] Basic 3D scene and model loading
- [ ] OrbitControls and touch support
- [ ] Material system and lighting
- [ ] Responsive UI and loading states

### Phase 2: Enhanced Features (Weeks 7-14)
- [ ] Animation system
- [ ] Annotation and hotspot system
- [ ] Product configurator
- [ ] Screenshot and sharing features

### Phase 3: Commercial Features (Weeks 15-24)
- [ ] AR/WebXR integration
- [ ] Advanced analytics
- [ ] E-commerce integration
- [ ] CMS backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
perf: performance improvements
test: adding tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Three.js community for the amazing 3D library
- Contributors and beta testers
- Open source projects that inspired this work

<div align="center">
  <strong>Built with ❤️ for the 3D web</strong>
</div>