export interface Note {
  id: string;
  userId: string;
  title: string;
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  patientId?: string;
  createdAt: Date;
  updatedAt: Date;
  styleId?: string;
  audioUrl?: string;
  transcription?: string;
}

export interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  visitDate: string;
}

export interface SoapNote {
  patientInfo: PatientInfo;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
} 