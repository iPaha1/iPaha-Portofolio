// lib/cv-templates/bold-creative.ts

// lib/cv-templates/bold-creative.ts
import { CVTemplate } from "./types";

export const boldCreative: CVTemplate = {
  id: "bold-creative",
  name: "Bold Creative",
  description: "Clean single-column layout, generous whitespace — ATS-safe.",
  thumbnail: "/cv-templates/bold-creative.png",
  accentColor: "#10b981",
  category: "ats-safe",
  renderHtml: (d) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; color: #1c1917; font-size: 10.5pt; line-height: 1.5; }
  h1 { font-size: 22pt; font-weight: 800; margin: 0 0 2px; }
  .title { font-size: 11pt; color: #57534e; margin-bottom: 8px; }
  .contact { font-size: 9pt; color: #78716c; margin-bottom: 16px; }
  .contact span:not(:last-child)::after { content: " · "; }
  h2 { font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
       color: ${boldCreative.accentColor}; border-bottom: 1.5px solid ${boldCreative.accentColor};
       padding-bottom: 3px; margin: 16px 0 8px; }
  .entry { margin-bottom: 10px; }
  .entry-header { display: flex; justify-content: space-between; font-weight: 700; }
  .entry-sub { color: #57534e; font-size: 9.5pt; margin-bottom: 3px; }
  ul { margin: 3px 0 0; padding-left: 14px; }
  li { margin-bottom: 2px; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 3px; padding: 2px 8px; font-size: 9pt; }
</style>
</head>
<body>
  <h1>${d.fullName}</h1>
  ${d.title ? `<div class="title">${d.title}</div>` : ""}
  <div class="contact">
    ${[d.email, d.phone, d.location, d.linkedin].filter(Boolean).map(c => `<span>${c}</span>`).join("")}
  </div>
  ${d.summary ? `<h2>Summary</h2><p>${d.summary}</p>` : ""}
  <h2>Experience</h2>
  ${d.experience.map(e => `
    <div class="entry">
      <div class="entry-header"><span>${e.role}, ${e.company}</span><span>${e.dates}</span></div>
      <ul>${e.bullets.map(b => `<li>${b}</li>`).join("")}</ul>
    </div>`).join("")}
  <h2>Education</h2>
  ${d.education.map(ed => `
    <div class="entry">
      <div class="entry-header"><span>${ed.degree}, ${ed.institution}</span><span>${ed.dates}</span></div>
    </div>`).join("")}
  ${d.skills.length ? `<h2>Skills</h2><div class="skills">${d.skills.map(s => `<span class="skill">${s}</span>`).join("")}</div>` : ""}
</body>
</html>`,
};