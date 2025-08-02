import { NextResponse } from 'next/server';

// Standardized error response format
export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

// Standard error response helper
export const createErrorResponse = (
  message: string, 
  status: number = 500, 
  details?: string
): NextResponse => {
  return NextResponse.json(
    { 
      error: message, 
      details,
      timestamp: new Date().toISOString()
    } as ApiError, 
    { status }
  );
};

// Input validation helper
export const validateRequiredParams = (
  params: Record<string, any>, 
  required: string[]
): string | null => {
  for (const param of required) {
    if (!params[param]) {
      return `Missing required parameter: ${param}`;
    }
  }
  return null;
};

// Parse and validate numeric parameters
export const parseNumericParam = (
  value: string | null, 
  paramName: string, 
  defaultValue?: number
): number => {
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required numeric parameter: ${paramName}`);
  }
  
  const parsed = parseInt(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value for parameter: ${paramName}`);
  }
  
  return parsed;
};

// Standard success response helper
export const createSuccessResponse = (data: any): NextResponse => {
  return NextResponse.json({
    ...data,
    success: true,
    timestamp: new Date().toISOString()
  });
};