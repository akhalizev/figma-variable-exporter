# Figma Variable Exporter

A powerful Figma plugin for exporting design variables with enhanced organization, formatting, and visualization options.

## Features

- **Organized Variable Export**: Variables are grouped by their types (COLOR, FLOAT, STRING, etc.)
- **Enhanced Color Handling**: Includes both RGB and HEX values for color variables
- **Customizable Export Format**: Choose between organized structure or flat list exports
- **Export Metadata**: Includes file name, export date, and variable counts
- **Visual Color Preview**: Preview color variables directly in the plugin UI
- **Flexible JSON Formatting**: Configure indentation options for exported JSON

## Installation

Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

## Usage

1. Open a Figma file that contains variables
2. Run the plugin from **Plugins > Development > Variable exporter**
3. Preview your variables in the plugin UI
4. Configure export options in the Settings tab if needed
5. Click "Export Variables" to download a JSON file

## Export Format

The plugin provides two export formats:

### Organized by Type

```json
{
  "metadata": {
    "exportDate": "2025-05-16T10:30:00.000Z",
    "fileName": "Design System",
    "totalVariables": 32
  },
  "variablesByType": {
    "COLOR": {
      "count": 20,
      "variables": [
        {
          "name": "Primary/Blue-500",
          "type": "COLOR",
          "value": {
            "rgb": { "r": 0.2, "g": 0.4, "b": 0.8 },
            "hex": "#3366cc"
          },
          "variableId": "123abc"
        }
      ]
    }
  }
}
```

### Flat List

```json
{
  "metadata": {
    "exportDate": "2025-05-16T10:30:00.000Z",
    "fileName": "Design System",
    "totalVariables": 32
  },
  "variables": [
    {
      "name": "Primary/Blue-500",
      "type": "COLOR",
      "value": {
        "rgb": { "r": 0.2, "g": 0.4, "b": 0.8 },
        "hex": "#3366cc"
      },
      "variableId": "123abc"
    }
  ]
}
```

## Development

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

### Setup

1. Clone this repository
   ```
   git clone https://github.com/akhalizev/figma-variable-exporter.git
   ```
2. Install dependencies
   ```
   cd figma-variable-exporter
   npm install
   ```
3. Build the plugin
   ```
   npm run build
   ```
   or for live updates while developing:
   ```
   npm run watch
   ```

We recommend writing TypeScript code using Visual Studio Code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/
2. Open this directory in Visual Studio Code
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item, then select "npm: watch"

## License

MIT License

## Acknowledgements

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Figma Variables API](https://www.figma.com/plugin-docs/api/variables/)
