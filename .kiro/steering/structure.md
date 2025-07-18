# Project Structure

## Root Files
- `manifest.json`: Figma plugin configuration and metadata
- `package.json`: Node.js dependencies and build scripts
- `tsconfig.json`: TypeScript compiler configuration
- `README.md`: Comprehensive documentation with usage examples

## Source Files
- `code.ts`: Main plugin logic (TypeScript source)
- `code.js`: Compiled JavaScript (generated from `code.ts`)
- `ui.html`: Plugin UI with embedded CSS and JavaScript

## Configuration
- `.gitignore`: Git ignore patterns for node_modules, build artifacts
- `tsconfig.json`: Targets ES6 with strict mode, includes Figma types

## Key Patterns
- **Single-file architecture**: Main logic in `code.ts`, UI in `ui.html`
- **Type-first development**: Interfaces defined before implementation
- **Async/await**: Used for Figma API calls and variable resolution
- **Message-based communication**: UI and main thread communicate via `postMessage`

## Code Organization
- **Interfaces**: Defined at top of `code.ts` (e.g., `VariableExportData`, `OrganizedExport`)
- **Utility functions**: Helper functions for formatting, cleaning names, resolving values
- **Export functions**: Separate functions for JSON, CSS, and style guide generation
- **Event handlers**: Message listeners for UI interactions

## File Naming Conventions
- Use kebab-case for exported files (e.g., `design-system_variables.css`)
- Clean special characters from Figma file names for safe filenames
- Add mode suffixes for specific exports (e.g., `_Dark.json`, `_all_modes.css`)