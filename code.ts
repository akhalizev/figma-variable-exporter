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

async function getVariables(): Promise<void> {
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
      sectionFrame.counterAxisSizingMode = "AUTO";
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
      itemsGridFrame.counterAxisSizingMode = "AUTO";
      itemsGridFrame.layoutWrap = "WRAP"; // Enable wrapping
      itemsGridFrame.counterAxisAlignItems = 'MIN';
      sectionFrame.appendChild(itemsGridFrame);

      for (const variable of typeData.variables) {
        const itemFrame = figma.createFrame();
        itemFrame.name = variable.name;
        itemFrame.layoutMode = "VERTICAL";
        itemFrame.itemSpacing = ITEM_SPACING / 2;
        itemFrame.primaryAxisSizingMode = "AUTO";
        itemFrame.counterAxisSizingMode = "AUTO";
        // Set a min-width for items if desired, e.g., for better wrapping behavior
        itemFrame.resize(COLOR_SWATCH_SIZE * 2, itemFrame.height); 
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
          nameText.layoutAlign = "STRETCH";
          itemFrame.appendChild(nameText);

          const hexText = figma.createText();
          hexText.fontName = { family: "Inter", style: "Regular" };
          hexText.fontSize = 10;
          hexText.characters = variable.value.hex || "";
          hexText.layoutAlign = "STRETCH";
          itemFrame.appendChild(hexText);
        } else {
          // Handle other types (FLOAT, STRING, BOOLEAN)
          const nameText = figma.createText();
          nameText.fontName = { family: "Inter", style: "Regular" };
          nameText.fontSize = 12;
          nameText.characters = variable.name;
          nameText.layoutAlign = "STRETCH";
          itemFrame.appendChild(nameText);

          const valueText = figma.createText();
          valueText.fontName = { family: "Inter", style: "Regular" };
          valueText.fontSize = 10;
          valueText.characters = String(variable.value);
          valueText.layoutAlign = "STRETCH";
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

// Show the UI and run the plugin
figma.showUI(__html__, { width: 450, height: 550 });
getVariables();

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-style-guide') {
    if (msg.data) {
      await createStyleGuideFrame(msg.data as OrganizedExport);
    } else {
      figma.ui.postMessage({ type: 'error', error: 'No data received for style guide creation.' });
    }
  }
};