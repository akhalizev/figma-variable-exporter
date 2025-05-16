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

// Show the UI and run the plugin
figma.showUI(__html__, { width: 450, height: 550 });
getVariables();