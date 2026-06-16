/**
 * Core types for the migration agent system.
 */

export interface MigrationOptions {
  dryRun?: boolean;
  verbose?: boolean;
  outputDir?: string;
}

export interface SeleniumPattern {
  type: PatternType;
  original: string;
  lineNumber: number;
  selector?: string;
  action?: string;
}

export type PatternType =
  | 'import'
  | 'driver-init'
  | 'navigation'
  | 'find-element'
  | 'find-elements'
  | 'click'
  | 'send-keys'
  | 'wait'
  | 'assertion'
  | 'driver-quit'
  | 'screenshot'
  | 'select-dropdown'
  | 'frame-switch'
  | 'window-handle'
  | 'cookie'
  | 'execute-script';

export interface MigrationContext {
  filePath: string;
  sourceCode: string;
  sourceLines: number;
  imports: string[];
  patterns: SeleniumPattern[];
  complexity: 'low' | 'medium' | 'high';
  testFramework: 'jest' | 'mocha' | 'jasmine' | 'unknown';
  hasPageObject: boolean;
}

export interface TransformationPlan {
  steps: TransformStep[];
  estimatedConfidence: number;
}

export interface TransformStep {
  type: PatternType;
  description: string;
  count: number;
}

export interface TransformResult {
  code: string;
  outputPath: string;
  conversions: Conversion[];
}

export interface Conversion {
  pattern: PatternType;
  from: string;
  to: string;
  lineNumber: number;
  confidence: number;
}

export interface ValidationResult {
  syntaxValid: boolean;
  patternsComplete: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
}

export interface MigrationResult {
  inputFile: string;
  outputFile: string;
  context: MigrationContext;
  plan: TransformationPlan;
  transformed: TransformResult;
  validation: ValidationResult;
  success: boolean;
}
