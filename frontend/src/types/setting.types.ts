export enum SettingType {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export enum SettingCategory {
  MEMBERSHIP = 'MEMBERSHIP',
  SAVINGS = 'SAVINGS',
  LOAN = 'LOAN',
  INTEREST = 'INTEREST',
  PENALTY = 'PENALTY',
  GENERAL = 'GENERAL',
}

export interface ValidationRules {
  min?: number;
  max?: number;
  required?: boolean;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
}

export interface CooperativeSetting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  label: string;
  description: string | null;
  unit: string | null;
  isEditable: boolean;
  isActive: boolean;
  validation: ValidationRules | null;
  updatedBy: string | null;
  updatedByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedSettings {
  [key: string]: CooperativeSetting[];
}