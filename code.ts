/* Import Figma types (ensure @figma/plugin-typings is installed) */
/// <reference types="@figma/plugin-typings" />

// Define interface for export data
interface VariableExportData {
  name: string;
  type: string;
  value: any; // Flexible to handle different variable value types
  hexValue?: string; // Optional hex value for colors
  variableId: string; // Variable ID for reference
}

// Define interface for color value
interface ColorValue {
  rgb: { r: number; g: number; b: number; a?: number };
  hex: string;
}

// Define interface for organized export
interface OrganizedExport {
  metadata: {
    exportDate: string;
    fileName: string;
    fileKey?: string;
    totalVariables: number;
  };
  variablesByType: {
    [type: string]: {
      count: number;
      variables: VariableExportData[];
    };
  };
}

// Define interface for UI message
interface UIMessage {
  count: number;
  exportData: OrganizedExport;
}

interface CssExportOptions {
  usePrefix: boolean;
  prefix: string;
  groupByCollection: boolean;
  removeDuplicateWords: boolean;
}

/**
 * Convert RGB values (0-1 range) to hex string format
 */
function rgbToHex(r: number, g: number, b: number, a?: number): string {
  // Convert from 0-1 range to 0-255 range and then to hex
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  
  // If alpha is provided and not 1, append it
  if (a !== undefined && a !== 1) {
    const alphaHex = toHex(a);
    return `${hex}${alphaHex}`;
  }
  
  return hex;
}

/**
 * Formats a variable value based on its type for better visualization
 */
function formatVariableValue(value: any, type: string): any {
  if (!value) return null;
  
  switch(type) {
    case 'COLOR':
      if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
        return {
          rgb: { 
            r: value.r, 
            g: value.g, 
            b: value.b,
            ...(value.a !== undefined ? { a: value.a } : {})
          },
          hex: rgbToHex(value.r, value.g, value.b, value.a)
        };
      }
      return value;
      
    // Format other types as needed
    default:
      return value;
  }
}

async function getVariables(): Promise<OrganizedExport> {
  const variables: Variable[] = await figma.variables.getLocalVariablesAsync();
  const count: number = variables.length;
  
  // Get current file information
  const fileName = figma.root.name;
  const fileKey = figma.fileKey;
  
  // Organize variables by type
  const variablesByType: { [type: string]: { count: number, variables: VariableExportData[] } } = {};
  
  // Process each variable
  variables.forEach((v: Variable) => {
    const type = v.resolvedType;
    const value = v.valuesByMode[Object.keys(v.valuesByMode)[0]] || null;
    
    // Format the value based on its type
    const formattedValue = formatVariableValue(value, type);
    
    // Create variable data object
    const variableData: VariableExportData = {
      name: v.name,
      type: type,
      value: formattedValue,
      variableId: v.id
    };
    
    // Initialize type group if it doesn't exist
    if (!variablesByType[type]) {
      variablesByType[type] = {
        count: 0,
        variables: []
      };
    }
    
    // Add variable to its type group
    variablesByType[type].count++;
    variablesByType[type].variables.push(variableData);
  });
  
  // Sort variables alphabetically within each type
  Object.keys(variablesByType).forEach(type => {
    variablesByType[type].variables.sort((a, b) => a.name.localeCompare(b.name));
  });
  
  // Create organized export structure
  const organizedExport: OrganizedExport = {
    metadata: {
      exportDate: new Date().toISOString(),
      fileName: fileName,
      fileKey: fileKey,
      totalVariables: count
    },
    variablesByType: variablesByType
  };

  // Send data to the UI
  figma.ui.postMessage({ count, exportData: organizedExport } as UIMessage);
  
  // Return the data for export functions
  return organizedExport;
}

/**
 * Creates a visual style guide frame in Figma based on the exported variables.
 */
async function createStyleGuideFrame(exportData: OrganizedExport): Promise<void> {
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });

    const PADDING = 40;
    const ITEM_SPACING = 20;
    const SECTION_SPACING = 60;
    const COLOR_SWATCH_SIZE = 80;
    const TEXT_NODE_HEIGHT = 20;

    const parentFrame = figma.createFrame();
    parentFrame.name = "Variable Style Guide - " + exportData.metadata.fileName;
    parentFrame.layoutMode = "VERTICAL";
    parentFrame.paddingTop = PADDING;
    parentFrame.paddingRight = PADDING;
    parentFrame.paddingBottom = PADDING;
    parentFrame.paddingLeft = PADDING;
    parentFrame.itemSpacing = SECTION_SPACING;
    parentFrame.primaryAxisSizingMode = "AUTO";
    parentFrame.counterAxisSizingMode = "AUTO";

    const title = figma.createText();
    title.fontName = { family: "Inter", style: "Bold" };
    title.fontSize = 24;
    title.characters = `Variable Style Guide: ${exportData.metadata.fileName}`;
    parentFrame.appendChild(title);

    for (const type in exportData.variablesByType) {
      const typeData = exportData.variablesByType[type];
      if (typeData.variables.length === 0) continue;

      const sectionFrame = figma.createFrame();
      sectionFrame.name = type + " Variables";
      sectionFrame.layoutMode = "VERTICAL";
      sectionFrame.itemSpacing = ITEM_SPACING * 2;
      sectionFrame.primaryAxisSizingMode = "AUTO";
      sectionFrame.counterAxisSizingMode = "AUTO"; // Make frame hug its content
      parentFrame.appendChild(sectionFrame);

      const sectionTitle = figma.createText();
      sectionTitle.fontName = { family: "Inter", style: "Bold" };
      sectionTitle.fontSize = 18;
      sectionTitle.characters = type;
      sectionFrame.appendChild(sectionTitle);

      const itemsGridFrame = figma.createFrame();
      itemsGridFrame.name = type + " Items";
      itemsGridFrame.layoutMode = "HORIZONTAL"; // Use HORIZONTAL for a wrapping grid-like layout
      itemsGridFrame.itemSpacing = ITEM_SPACING;
      itemsGridFrame.primaryAxisSizingMode = "AUTO"; // Let it grow with content
      itemsGridFrame.counterAxisSizingMode = "AUTO"; // Make it hug content width
      itemsGridFrame.layoutWrap = "WRAP"; // Enable wrapping
      itemsGridFrame.counterAxisAlignItems = 'MIN';
      sectionFrame.appendChild(itemsGridFrame);

      for (const variable of typeData.variables) {
        const itemFrame = figma.createFrame();
        itemFrame.name = variable.name;
        itemFrame.layoutMode = "VERTICAL";
        itemFrame.itemSpacing = ITEM_SPACING / 2;
        itemFrame.primaryAxisSizingMode = "AUTO";
        itemFrame.counterAxisSizingMode = "AUTO"; // Make item frame hug content
        itemsGridFrame.appendChild(itemFrame);

        if (variable.type === "COLOR" && variable.value && variable.value.rgb) {
          const colorSwatch = figma.createRectangle();
          colorSwatch.name = "Color Swatch";
          colorSwatch.resize(COLOR_SWATCH_SIZE, COLOR_SWATCH_SIZE);
          const { r, g, b, a } = variable.value.rgb;
          colorSwatch.fills = [{ type: "SOLID", color: { r, g, b }, opacity: a !== undefined ? a : 1 }];
          colorSwatch.cornerRadius = 4;
          itemFrame.appendChild(colorSwatch);

          const nameText = figma.createText();
          nameText.fontName = { family: "Inter", style: "Regular" };
          nameText.fontSize = 12;
          nameText.characters = variable.name;
          itemFrame.appendChild(nameText);

          const hexText = figma.createText();
          hexText.fontName = { family: "Inter", style: "Regular" };
          hexText.fontSize = 10;
          hexText.characters = variable.value.hex || "";
          itemFrame.appendChild(hexText);
        } else {
          // Handle other types (FLOAT, STRING, BOOLEAN)
          const nameText = figma.createText();
          nameText.fontName = { family: "Inter", style: "Regular" };
          nameText.fontSize = 12;
          nameText.characters = variable.name;
          itemFrame.appendChild(nameText);

          const valueText = figma.createText();
          valueText.fontName = { family: "Inter", style: "Regular" };
          valueText.fontSize = 10;
          valueText.characters = String(variable.value);
          itemFrame.appendChild(valueText);
        }
      }
    }

    figma.currentPage.appendChild(parentFrame);
    figma.viewport.scrollAndZoomIntoView([parentFrame]);

    figma.ui.postMessage({ type: 'style-guide-created' });
  } catch (error) {
    console.error("Error creating style guide:", error);
    figma.ui.postMessage({ type: 'error', error: 'Failed to create style guide: ' + String(error) });
  }
}

function generateCssVariables(data: OrganizedExport, options: CssExportOptions): string {
  let css = '/* Figma Variables Export */\n';
  css += '/* Generated on ' + new Date().toISOString() + ' */\n\n';
  css += ':root {\n';

  const prefix = options.usePrefix ? options.prefix : '';

  if (options.groupByCollection) {
    // Group by type (since that's how the data is organized)
    for (const typeName in data.variablesByType) {
      const typeData = data.variablesByType[typeName];
      css += `  /* ${typeName} */\n`;
      
      typeData.variables.forEach((variable: VariableExportData) => {
        const variableName = cleanVariableName(variable.name, prefix, options.removeDuplicateWords);
        const value = formatCssValue(variable.value, variable.type);
        css += `  --${variableName}: ${value};\n`;
      });
      
      css += '\n';
    }
  } else {
    // Flat structure - iterate through all variable types
    for (const typeName in data.variablesByType) {
      const typeData = data.variablesByType[typeName];
      typeData.variables.forEach((variable: VariableExportData) => {
        const variableName = cleanVariableName(variable.name, prefix, options.removeDuplicateWords);
        const value = formatCssValue(variable.value, variable.type);
        css += `  --${variableName}: ${value};\n`;
      });
    }
  }

  css += '}\n';
  return css;
}

function formatCssValue(value: any, type: string): string {
  switch (type) {
    case 'COLOR':
      if (typeof value === 'object' && value.hex) {
        return value.hex;
      }
      return value;
    case 'FLOAT':
      return `${value}`;
    case 'STRING':
      return `"${value}"`;
    case 'BOOLEAN':
      return value ? 'true' : 'false';
    default:
      return `"${value}"`;
  }
}

function cleanVariableName(name: string, prefix: string, removeDuplicates: boolean = true): string {
  // Convert to lowercase and replace special characters
  let cleanName = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  
  if (removeDuplicates) {
    // Remove duplicate words (e.g., accordion-accordion -> accordion)
    const words = cleanName.split('-').filter(word => word.length > 0);
    const uniqueWords = [];
    
    for (let i = 0; i < words.length; i++) {
      // Skip if current word is the same as previous word
      if (i === 0 || words[i] !== words[i - 1]) {
        uniqueWords.push(words[i]);
      }
    }
    
    cleanName = uniqueWords.join('-');
  }
  
  // Apply prefix
  const finalName = prefix + cleanName;
  
  // Additional check: if prefix ends with same word that cleanName starts with, remove duplication
  if (removeDuplicates && prefix && cleanName) {
    const prefixWords = prefix.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().split('-').filter(w => w.length > 0);
    const nameWords = cleanName.split('-').filter(w => w.length > 0);
    
    if (prefixWords.length > 0 && nameWords.length > 0 && prefixWords[prefixWords.length - 1] === nameWords[0]) {
      // Remove the duplicate word from the beginning of cleanName
      nameWords.shift();
      cleanName = nameWords.join('-');
      return prefix + cleanName;
    }
  }
  
  return finalName;
}

// Show the UI and run the plugin
figma.showUI(__html__, { width: 450, height: 640 });
getVariables();

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'get-variables') {
    const variables = await getVariables();
    figma.ui.postMessage({ type: 'variables-data', data: variables });
  } else if (msg.type === 'export-json') {
    const variables = await getVariables();
    const jsonString = JSON.stringify(variables, null, msg.indent || 2);
    figma.ui.postMessage({ 
      type: 'download-file', 
      filename: `${figma.root.name.replace(/[^a-zA-Z0-9]/g, '_')}_variables.json`,
      content: jsonString,
      mimeType: 'application/json'
    });
  } else if (msg.type === 'export-css') {
    const variables = await getVariables();
    const cssContent = generateCssVariables(variables, msg.options);
    figma.ui.postMessage({ 
      type: 'download-file', 
      filename: `${figma.root.name.replace(/[^a-zA-Z0-9]/g, '_')}_variables.css`,
      content: cssContent,
      mimeType: 'text/plain'
    });
  } else if (msg.type === 'create-style-guide') {
    if (msg.data) {
      await createStyleGuideFrame(msg.data as OrganizedExport);
    } else {
      figma.ui.postMessage({ type: 'error', error: 'No data received for style guide creation.' });
    }
  }
};