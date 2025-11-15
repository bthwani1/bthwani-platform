# UI Components Dependencies

## Required Dependencies

The shared UI components require the following dependencies:

### Core Dependencies

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0"  // For Next.js/web
  // OR
  "react-native": "^0.72.0"  // For React Native apps
}
```

### i18n

```json
{
  "react-i18next": "^13.0.0",
  "i18next": "^23.0.0"
}
```

### Styling (Choose one)

#### Tailwind CSS (Recommended)
```json
{
  "tailwindcss": "^3.3.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0"
}
```

#### CSS Modules
```json
{
  // No additional dependencies needed
}
```

#### Styled Components
```json
{
  "styled-components": "^6.0.0"
}
```

### Testing (Optional but Recommended)

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0"
  }
}
```

### A11y Tools

```json
{
  "devDependencies": {
    "pa11y": "^7.0.0",
    "eslint-plugin-jsx-a11y": "^6.7.0"
  }
}
```

## Installation

### For Next.js (Dashboards/Web)

```bash
npm install react react-dom react-i18next i18next
npm install -D tailwindcss autoprefixer postcss
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D pa11y eslint-plugin-jsx-a11y
```

### For React Native (Apps)

```bash
npm install react-native react-i18next i18next
npm install -D @testing-library/react-native
npm install -D eslint-plugin-jsx-a11y
```

## Configuration

### Tailwind CSS Setup

Create `tailwind.config.js`:

```js
module.exports = {
  content: [
    './shared/ui/components/**/*.{ts,tsx}',
    './apps/**/*.{ts,tsx}',
    './dashboards/**/*.{ts,tsx}',
    './web/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### i18n Setup

See `shared/i18n/README.md` for i18n configuration.

### ESLint Setup

Add to `.eslintrc.js`:

```js
module.exports = {
  plugins: ['jsx-a11y'],
  rules: {
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
  },
}
```

## Notes

- Components use Tailwind CSS classes by default
- For React Native, you'll need to adapt Tailwind classes to StyleSheet
- i18n is required for all text content
- A11y tools are recommended for CI/CD

