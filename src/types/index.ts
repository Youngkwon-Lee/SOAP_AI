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

export interface Template {
  id: string;
  name: string;
  profession: string;
  specialty: string;
  format: string;
  example: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  name: string;
  profession: string;
  specialty: string;
  format: string;
  example: string;
}

export type NoteType = 
  | 'Physical Therapy' 
  | 'Occupational Therapy'
  | 'Speech Therapy' 
  | 'Massage Therapy'
  | 'Psychotherapy'
  | 'Nurse Practitioner'
  | 'Clinical Social Worker'
  | 'Psychiatrist'
  | 'Chiropractor'
  | 'Veterinary'
  | 'Acupuncture'
  | 'Pharmacy'
  | 'Podiatry'
  | 'Dentistry'
  | 'Exercise Therapy'
  | 'Genetic Counselling'
  | 'Athletic Trainer'
  | 'Dietitian / Nutritionist'
  | 'Paramedic'
  | 'EMS';

export interface UserNote {
  id: string;
  userId: string;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
  note: SoapNote;
}

export type SectionKey = 'subjective' | 'objective' | 'assessment' | 'plan'; 