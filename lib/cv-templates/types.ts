// lib/cv-templates/types.ts
export interface CVData {
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  experience: { role: string; company: string; dates: string; bullets: string[] }[];
  education: { degree: string; institution: string; dates: string }[];
  skills: string[];
  raw: string; // fallback: the full parsed CV text if structured parse fails
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;       // path in /public/cv-templates/
  accentColor: string;
  category: "modern" | "classic" | "creative" | "minimal" | "ats-safe";
  renderHtml: (data: CVData) => string; // full standalone HTML document
}