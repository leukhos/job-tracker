# Migrating Job Tracker from Create React App to Vite

This guide provides step-by-step instructions for migrating your Job Tracker application from Create React App (CRA) to Vite.

## Why Migrate to Vite?

- **Speed**: Vite offers significantly faster development server startup and hot module replacement
- **Modern**: Better support for modern JavaScript features and TypeScript
- **Actively Maintained**: Regular updates and improvements
- **Smaller Bundles**: More efficient production builds
- **Simpler Configuration**: Less complex than CRA's webpack configuration

## Migration Steps

### 1. Create a New Vite Project

```bash
# Create a new Vite project in a different directory
npm create vite@latest job-tracker-vite -- --template react

# Navigate to the new project
cd job-tracker-vite

# Install dependencies
npm install
```

### 2. Install Required Dependencies

```bash
# Install your current dependencies
npm install lucide-react

# Install development dependencies
npm install -D tailwindcss postcss autoprefixer
```

### 3. Configure TailwindCSS

```bash
# Initialize Tailwind CSS
npx tailwindcss init -p
```

Update the `tailwind.config.js` file:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create or update `src/index.css` with Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Copy Source Files

Copy the following files/directories from your CRA project to the Vite project:
- `src/JobTracker.js`
- `src/api/` directory
- Any other components, hooks, or utilities

### 5. Update Entry Point

Update `src/main.jsx` (Vite's entry point) to match your CRA's `index.js`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import JobTracker from './JobTracker'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <JobTracker />
  </React.StrictMode>,
)
```

### 6. Environment Variables

Create a `.env` file in the root of your Vite project:

```
VITE_API_URL=http://localhost:8070/api
```

Update your API file to use Vite's environment variables:

```js
// src/api/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8070/api';
// rest of the file remains the same
```

### 7. Public Files

Copy any files from your CRA's `public/` directory to Vite's `public/` directory.

Update the `index.html` file (now in the root directory in Vite) to include any necessary meta tags, scripts, or links from your CRA's `public/index.html`.

### 8. Update Package.json Scripts

Your Vite project's `package.json` should have these scripts:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview"
}
```

### 9. Test and Debug

Run the development server to test your migration:

```bash
npm run dev
```

### 10. Update Backend API URL (if necessary)

If your backend expects requests from a specific origin, update CORS settings to allow requests from your Vite development server (typically http://localhost:5173).

## Common Migration Issues

### Import Path Resolution

Vite handles import paths differently than CRA:
- If you're using absolute imports, you'll need to configure them in `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### SVG Imports

If you're importing SVGs as React components, you'll need to add a plugin:

```bash
npm install -D vite-plugin-svgr
```

Update `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
})
```

## Production Deployment

Build your application for production:

```bash
npm run build
```

The production files will be in the `dist/` directory, which you can deploy to any static hosting service.

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [Vite for React](https://vitejs.dev/guide/features.html#jsx)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/guides/vite)
