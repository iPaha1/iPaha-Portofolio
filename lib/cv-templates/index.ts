// lib/cv-templates/index.ts
import { boldCreative } from "./bold-creative";
import { classicSerif } from "./classic-serif";
import { modernMinimal } from "./modern-minimal";
import { CVTemplate } from "./types";

export const CV_TEMPLATES: CVTemplate[] = [modernMinimal, classicSerif, boldCreative];
export const getTemplate = (id: string) => CV_TEMPLATES.find(t => t.id === id) ?? CV_TEMPLATES[0];