# Figma Variable Exporter 🎨

**Transform your Figma variables into production-ready code with one click!**

This powerful Figma plugin streamlines your design-to-development workflow by exporting your design variables in multiple formats, with support for all your variable modes (Light, Dark, Mobile, etc.).

![Plugin Preview](https://img.shields.io/badge/Figma-Plugin-orange?logo=figma&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.2.2-blue)

## ✨ What This Plugin Does

Turn your carefully crafted Figma variables into:
- **CSS Custom Properties** ready for your stylesheets
- **JSON data** for your design tokens
- **Visual Style Guides** generated directly in Figma
- **Multi-mode exports** for Light/Dark themes and responsive breakpoints

## 🚀 Key Features

### 🎯 **Smart Export Options**
- **All Variable Types**: Colors, typography scales, spacing values, and more
- **Multi-Mode Support**: Export Light mode, Dark mode, or all modes at once
- **Clean Variable Names**: Automatically removes duplicate words (`accordion-accordion` → `accordion`)
- **Custom Prefixes**: Add your own prefixes like `--ds-` or `--brand-`

### 🎨 **CSS Custom Properties**
Perfect for modern web development:
```css
:root {
  /* Colors */
  --color-primary: #007AFF;
  --color-background: #F2F2F7;
  
  /* Spacing */
  --spacing-lg: 24px;
  --spacing-md: 16px;
}

/* Dark mode variables */
[data-mode="Dark"] {
  --color-primary: #0A84FF;
  --color-background: #1C1C1E;
}
```

### 📊 **Organized JSON Export**
Get structured data for your design system:
```json
{
  "metadata": {
    "fileName": "Design System",
    "modes": ["Light", "Dark", "Mobile"],
    "totalVariables": 156
  },
  "variablesByType": {
    "COLOR": { "count": 24, "variables": [...] },
    "FLOAT": { "count": 12, "variables": [...] }
  }
}
```

### 🖼️ **Visual Style Guide Generator**
Create professional style guide frames in Figma showing:
- Color swatches with hex values
- Organized layout with up to 20 variables per row
- Proper spacing and typography
- All variable types beautifully displayed

## 📋 How to Use

### Step 1: Install & Open
1. Install the plugin from Figma Community (coming soon) or load it as a development plugin
2. Open any Figma file with variables
3. Run **Plugins → Variable Exporter**

### Step 2: Choose Your Export
The plugin automatically detects all your variable modes:

**For CSS Export:**
- Choose specific mode (Dark, Light, etc.) or "All modes"
- Toggle variable prefix on/off
- Enable/disable grouping by type
- Export generates clean CSS custom properties

**For JSON Export:**
- Select organized format or flat structure
- Choose indentation level
- Pick specific mode or export all modes

**For Style Guide:**
- Click "Create Style Guide" 
- Generates a visual frame with all your variables
- Colors show as swatches, other variables as labeled items

### Step 3: Integrate Into Your Project
- **CSS files** are ready to import into your stylesheets
- **JSON files** work with design token tools and build processes
- **Style guides** help communicate design decisions to your team

## 🎨 Real-World Examples

### Design System Teams
Export your complete design system with all modes:
```bash
MyDesignSystem_variables_all_modes.css
MyDesignSystem_variables_Dark.json
MyDesignSystem_variables_Light.json
```

### Developers
Get clean, prefixed CSS variables:
```css
--ds-color-primary: #007AFF;
--ds-color-secondary: #5856D6;
--ds-spacing-xl: 32px;
--ds-spacing-lg: 24px;
```

### Design Documentation
Create visual style guides showing:
- All color variables with hex codes
- Spacing values organized in rows
- Typography scales and other design tokens

## 🔧 Export Options Explained

| Option | What it does | Best for |
|--------|-------------|----------|
| **Variable Prefix** | Adds prefix to all CSS variables | Preventing naming conflicts |
| **Group by Type** | Organizes variables with comments | Readable, maintainable CSS |
| **Remove Duplicates** | Cleans redundant words from names | Shorter, cleaner variable names |
| **Mode Selection** | Export specific or all modes | Theme switching, responsive design |
| **JSON Indentation** | Controls file formatting | Code readability preferences |

## 🌟 Advanced Features

### Variable Alias Resolution
The plugin automatically resolves variable references:
- If Color A references Color B, you get the actual color value
- No more `[object Object]` in your exports
- Works with nested references (A → B → C → actual value)

### Multi-Mode CSS Generation
When exporting all modes, get CSS ready for theme switching:
```css
/* Default/Light mode */
:root {
  --color-text: #000000;
}

/* Dark mode */
[data-mode="Dark"] {
  --color-text: #FFFFFF;
}
```

### Smart File Naming
Files are automatically named with mode information:
- `DesignSystem_variables.json` (default export)
- `DesignSystem_variables_Dark.json` (Dark mode only)
- `DesignSystem_variables_all_modes.css` (all modes)

## 💡 Tips & Best Practices

1. **Organize Before Export**: Clean up your Figma variable names for better CSS output
2. **Use Descriptive Modes**: Name your modes clearly (Light/Dark vs Mode1/Mode2)
3. **Test Exports**: Preview the CSS/JSON before integrating into your codebase
4. **Style Guides**: Use generated style guides for design reviews and documentation
5. **Version Control**: Keep exported files in version control to track design changes

## 🚨 Troubleshooting

**Plugin shows "No variables found"**
- Make sure your Figma file contains local variables
- Variables must be published to collections

**Color shows as [object Object]**
- This is fixed in the latest version! Variable aliases are now properly resolved

**Export button not working**
- Try refreshing the plugin
- Check browser console for any error messages

## 📄 License

MIT License - Feel free to use in personal and commercial projects.

---

**Made with ❤️ for the design and development community**

*Have feedback or suggestions? [Open an issue](https://github.com/akhalizev/figma-variable-exporter/issues) or contribute to make this plugin even better!*
