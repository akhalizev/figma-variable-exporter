/* Import Figma types (ensure @figma/plugin-typings is installed) */
/// <reference types="@figma/plugin-typings" />

// Define interface for export data
interface VariableExportData {
  name: string;
  type: string;
  value: any; // Flexible to handle different variable value types
  hexValue?: string; // Optional hex value for colors
  variableId: string; // Variable ID for reference
  mode?: string; // Mode name for this value
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
    modes: string[]; // Available modes
  };
  variablesByType: {
    [type: string]: {
      count: number;
      variables: VariableExportData[];
    };
  };
  variablesByMode?: {
    [mode: string]: {
      [type: string]: {
        count: number;
        variables: VariableExportData[];
      };
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
  mode?: string;
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
 * Resolves a variable value, handling variable aliases/references
 */
async function resolveVariableValue(value: any, type: string): Promise<any> {
  if (!value) return null;
  
  // Check if this is a variable alias (reference to another variable)
  if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    try {
      // Resolve the referenced variable
      const referencedVariable = await figma.variables.getVariableByIdAsync(value.id);
      if (referencedVariable) {
        // Get the value from the referenced variable (use first mode)
        const referencedValue = referencedVariable.valuesByMode[Object.keys(referencedVariable.valuesByMode)[0]];
        // Recursively resolve in case the referenced variable also references another variable
        return await resolveVariableValue(referencedValue, referencedVariable.resolvedType);
      } else {
        console.warn(`Could not resolve variable reference with ID: ${value.id}`);
        return null;
      }
    } catch (error) {
      console.error('Error resolving variable alias:', error);
      return null;
    }
  }
  
  // Format the resolved value based on its type
  return formatVariableValue(value, type);
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
      // If it's still an object but not an RGB object, log it for debugging
      if (typeof value === 'object') {
        console.warn('Unexpected color value format:', value);
      }
      return value;
      
    case 'FLOAT':
    case 'STRING':
    case 'BOOLEAN':
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
  
  // Get all available modes from variables
  const allModes = new Set<string>();
  const modeIdToName = new Map<string, string>();
  
  // Collect all modes from all variables
  for (const v of variables) {
    for (const modeId of Object.keys(v.valuesByMode)) {
      if (!modeIdToName.has(modeId)) {
        // Get the collection to find mode names
        const collection = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
        if (collection) {
          const mode = collection.modes.find(m => m.modeId === modeId);
          if (mode) {
            modeIdToName.set(modeId, mode.name);
            allModes.add(mode.name);
          }
        }
      }
    }
  }
  
  const modeNames = Array.from(allModes).sort();
  
  // Organize variables by type (for default/first mode compatibility)
  const variablesByType: { [type: string]: { count: number, variables: VariableExportData[] } } = {};
  
  // Organize variables by mode
  const variablesByMode: { [mode: string]: { [type: string]: { count: number, variables: VariableExportData[] } } } = {};
  
  // Initialize mode structures
  for (const modeName of modeNames) {
    variablesByMode[modeName] = {};
  }
  
  // Process each variable (using for...of to support async/await)
  for (const v of variables) {
    const type = v.resolvedType;
    
    // Process each mode for this variable
    for (const modeId of Object.keys(v.valuesByMode)) {
      const value = v.valuesByMode[modeId];
      const modeName = modeIdToName.get(modeId) || 'Unknown Mode';
      
      // Resolve the value, handling variable aliases
      const formattedValue = await resolveVariableValue(value, type);
      
      // Create variable data object
      const variableData: VariableExportData = {
        name: v.name,
        type: type,
        value: formattedValue,
        variableId: v.id,
        mode: modeName
      };
      
      // Add to mode-specific organization
      if (!variablesByMode[modeName][type]) {
        variablesByMode[modeName][type] = {
          count: 0,
          variables: []
        };
      }
      variablesByMode[modeName][type].count++;
      variablesByMode[modeName][type].variables.push(variableData);
      
      // For backward compatibility, also add to the main structure (use first mode found)
      if (!variablesByType[type]) {
        variablesByType[type] = {
          count: 0,
          variables: []
        };
      }
      
      // Only add to main structure if this is the first mode we encounter for this variable
      const existingVariable = variablesByType[type].variables.find(existing => existing.variableId === v.id);
      if (!existingVariable) {
        variablesByType[type].count++;
        variablesByType[type].variables.push({
          ...variableData,
          mode: undefined // Remove mode info for main structure
        });
      }
    }
  }
  
  // Sort variables alphabetically within each type and mode
  Object.keys(variablesByType).forEach(type => {
    variablesByType[type].variables.sort((a, b) => a.name.localeCompare(b.name));
  });
  
  Object.keys(variablesByMode).forEach(modeName => {
    Object.keys(variablesByMode[modeName]).forEach(type => {
      variablesByMode[modeName][type].variables.sort((a, b) => a.name.localeCompare(b.name));
    });
  });
  
  // Create organized export structure
  const organizedExport: OrganizedExport = {
    metadata: {
      exportDate: new Date().toISOString(),
      fileName: fileName,
      fileKey: fileKey,
      totalVariables: count,
      modes: modeNames
    },
    variablesByType: variablesByType,
    variablesByMode: variablesByMode
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

      // Create a container for all rows
      const itemsContainer = figma.createFrame();
      itemsContainer.name = type + " Container";
      itemsContainer.layoutMode = "VERTICAL";
      itemsContainer.itemSpacing = ITEM_SPACING;
      itemsContainer.primaryAxisSizingMode = "AUTO";
      itemsContainer.counterAxisSizingMode = "AUTO";
      sectionFrame.appendChild(itemsContainer);

      // Group variables into rows of maximum 20 items each
      const ITEMS_PER_ROW = 20;
      const variables = typeData.variables;
      
      for (let i = 0; i < variables.length; i += ITEMS_PER_ROW) {
        const rowVariables = variables.slice(i, i + ITEMS_PER_ROW);
        
        // Create a row frame for this batch of variables
        const rowFrame = figma.createFrame();
        rowFrame.name = `${type} Row ${Math.floor(i / ITEMS_PER_ROW) + 1}`;
        rowFrame.layoutMode = "HORIZONTAL";
        rowFrame.itemSpacing = ITEM_SPACING;
        rowFrame.primaryAxisSizingMode = "AUTO";
        rowFrame.counterAxisSizingMode = "AUTO";
        rowFrame.counterAxisAlignItems = 'MIN';
        itemsContainer.appendChild(rowFrame);

        for (const variable of rowVariables) {
          const itemFrame = figma.createFrame();
          itemFrame.name = variable.name;
          itemFrame.layoutMode = "VERTICAL";
          itemFrame.itemSpacing = ITEM_SPACING / 2;
          itemFrame.primaryAxisSizingMode = "AUTO";
          itemFrame.counterAxisSizingMode = "AUTO"; // Make item frame hug content
          rowFrame.appendChild(itemFrame);

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
  css += '/* Generated on ' + new Date().toISOString() + ' */\n';
  
  // Determine which data to use based on mode selection
  let dataToUse: { [type: string]: { count: number, variables: VariableExportData[] } };
  
  if (options.mode && options.mode !== 'all' && data.variablesByMode && data.variablesByMode[options.mode]) {
    // Use specific mode data
    dataToUse = data.variablesByMode[options.mode];
    css += `/* Mode: ${options.mode} */\n`;
  } else if (options.mode === 'all' && data.variablesByMode) {
    // Export all modes
    css += '/* All Modes */\n\n';
    
    for (const modeName of Object.keys(data.variablesByMode)) {
      css += `/* Mode: ${modeName} */\n`;
      css += `[data-mode="${modeName}"] {\n`;
      
      const prefix = options.usePrefix ? options.prefix : '';
      const modeData = data.variablesByMode[modeName];
      
      if (options.groupByCollection) {
        for (const typeName in modeData) {
          const typeData = modeData[typeName];
          css += `  /* ${typeName} */\n`;
          
          typeData.variables.forEach((variable: VariableExportData) => {
            const variableName = cleanVariableName(variable.name, prefix, options.removeDuplicateWords);
            const value = formatCssValue(variable.value, variable.type);
            css += `  --${variableName}: ${value};\n`;
          });
          
          css += '\n';
        }
      } else {
        for (const typeName in modeData) {
          const typeData = modeData[typeName];
          typeData.variables.forEach((variable: VariableExportData) => {
            const variableName = cleanVariableName(variable.name, prefix, options.removeDuplicateWords);
            const value = formatCssValue(variable.value, variable.type);
            css += `  --${variableName}: ${value};\n`;
          });
        }
      }
      
      css += '}\n\n';
    }
    return css;
  } else {
    // Use default data (backward compatibility)
    dataToUse = data.variablesByType;
  }
  
  css += '\n:root {\n';

  const prefix = options.usePrefix ? options.prefix : '';

  if (options.groupByCollection) {
    // Group by type (since that's how the data is organized)
    for (const typeName in dataToUse) {
      const typeData = dataToUse[typeName];
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
    for (const typeName in dataToUse) {
      const typeData = dataToUse[typeName];
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
    let dataToExport;
    let filename = `${figma.root.name.replace(/[^a-zA-Z0-9]/g, '_')}_variables`;
    
    // Handle mode selection for JSON export
    if (msg.mode && msg.mode !== 'all' && variables.variablesByMode && variables.variablesByMode[msg.mode]) {
      // Export specific mode
      dataToExport = {
        ...variables,
        variablesByType: variables.variablesByMode[msg.mode],
        mode: msg.mode
      };
      filename += `_${msg.mode.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } else if (msg.mode === 'all') {
      // Export all modes structure
      dataToExport = variables;
    } else {
      // Default export (backward compatibility)
      dataToExport = variables;
    }
    
    const jsonString = JSON.stringify(dataToExport, null, msg.indent || 2);
    figma.ui.postMessage({ 
      type: 'download-file', 
      filename: `${filename}.json`,
      content: jsonString,
      mimeType: 'application/json'
    });
  } else if (msg.type === 'export-css') {
    const variables = await getVariables();
    const cssContent = generateCssVariables(variables, msg.options);
    let filename = `${figma.root.name.replace(/[^a-zA-Z0-9]/g, '_')}_variables`;
    
    // Add mode to filename if specific mode is selected
    if (msg.options.mode && msg.options.mode !== 'all') {
      filename += `_${msg.options.mode.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } else if (msg.options.mode === 'all') {
      filename += '_all_modes';
    }
    
    figma.ui.postMessage({ 
      type: 'download-file', 
      filename: `${filename}.css`,
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