export enum WizardStep {
  IDLE = 'IDLE',
  WAITING_LOCATION = 'WAITING_LOCATION',
  WAITING_TITLE = 'WAITING_TITLE',
  WAITING_DESCRIPTION = 'WAITING_DESCRIPTION',
  WAITING_CATEGORY = 'WAITING_CATEGORY',
  WAITING_PHOTOS = 'WAITING_PHOTOS',
  WAITING_ANONYMOUS = 'WAITING_ANONYMOUS',
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION',
}

export interface ReportData {
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  title?: string;
  description?: string;
  category?: string;
  photos?: Buffer[];
  isAnonymous?: boolean;
}

export interface UserSession {
  step: WizardStep;
  data: ReportData;
}