export interface HealingResult {
  found: boolean;
  selector?: string;
  confidence: number;
}

export interface HealingStrategy {
  name: string;
  fn: () => Promise<HealingResult>;
}

export interface HealLog {
  originalSelector: string;
  healedSelector: string;
  strategy: string;
  confidence: number;
  context: Record<string, unknown>;
  timestamp: string;
}
