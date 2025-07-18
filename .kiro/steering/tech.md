# Technology Stack

## Core Technologies
- **TypeScript**: Main plugin logic with strict type checking
- **HTML/CSS/JavaScript**: UI implementation
- **Figma Plugin API**: Integration with Figma's variable system

## Build System
- **TypeScript Compiler**: Compiles `.ts` to `.js` for plugin execution
- **ESLint**: Code linting with Figma plugin-specific rules

## Key Dependencies
- `@figma/plugin-typings`: Figma API type definitions
- `@figma/eslint-plugin-figma-plugins`: Figma-specific linting rules
- `@typescript-eslint/eslint-plugin`: TypeScript ESLint support

## Common Commands
```bash
# Build the plugin
npm run build

# Watch mode for development
npm run watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Plugin Architecture
- **Main thread** (`code.ts`): Handles Figma API interactions, variable processing
- **UI thread** (`ui.html`): User interface for export options and controls
- **Message passing**: Communication between main and UI threads via `postMessage`

## Code Standards
- Use TypeScript strict mode
- Follow ESLint configuration with Figma plugin rules
- Implement proper error handling for async operations
- Use interfaces for type safety (e.g., `VariableExportData`, `OrganizedExport`)