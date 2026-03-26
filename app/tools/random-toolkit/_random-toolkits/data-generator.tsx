"use client";

// app/tools/random-toolkit/_components/generators/data-generator.tsx

import React, { useState, useCallback } from "react";
import {
  GenerateButton, OutputList, CodeSnippet, SectionHeader, SliderControl,
} from "./shared";

// ─── Data pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = ["James","Oliver","Harry","George","Noah","Charlie","Jack","Alfie","Freddie","Archie","Emma","Olivia","Amelia","Sophie","Lily","Isabella","Grace","Mia","Ella","Charlotte","Aisha","Mohammed","Priya","Samuel","Fatima","Daniel","Elena","Carlos","Yuki","Amara","Luca","Zara","Marcus","Sofia","Ibrahim"];
const LAST_NAMES  = ["Smith","Jones","Williams","Taylor","Brown","Davies","Evans","Wilson","Thomas","Roberts","Johnson","Martin","Lee","Walker","Hall","Allen","Wright","Scott","Green","Baker","Patel","Khan","Singh","Ahmed","Nkosi","Okafor","Fernandez","Nakamura","Kowalski","Müller"];
const DOMAINS     = ["gmail.com","outlook.com","yahoo.com","hotmail.com","icloud.com","protonmail.com","fastmail.com"];
const COMPANIES   = ["Acme Corp","TechVision Ltd","Apex Systems","Nexus Group","Orion Digital","Vortex Labs","Meridian Solutions","Zenith Analytics","Summit Tech","Horizon Consulting","Nova Dynamics","Pinnacle Software","Atlas Networks","Vertex AI","Cascade Innovations"];
const STREETS     = ["High Street","Station Road","Main Street","Church Lane","Victoria Road","Green Lane","Park Avenue","Kings Road","Queen Street","Manor Drive","Brook Way","Forest Road","Hill Road","Oak Avenue","Maple Street"];
const CITIES      = ["London","Manchester","Birmingham","Leeds","Sheffield","Liverpool","Bristol","Cardiff","Edinburgh","Glasgow","Belfast","Nottingham","Leicester","Newcastle","Oxford","Cambridge","York","Brighton","Bath","Southampton"];
const COUNTRIES   = ["United Kingdom","United States","Canada","Australia","Germany","France","Netherlands","Sweden","Denmark","Norway","Ireland","New Zealand","Singapore","Japan","India"];
const JOB_TITLES  = ["Software Engineer","Product Manager","Data Analyst","UX Designer","Marketing Manager","Sales Executive","Operations Lead","Finance Manager","HR Coordinator","DevOps Engineer","Frontend Developer","Backend Developer","Full Stack Developer","Data Scientist","Business Analyst","Project Manager","Content Strategist","QA Engineer","Security Analyst","Solutions Architect"];

type DataType = "full-name" | "email" | "username" | "phone" | "address" | "company" | "job-title" | "full-user";

function rnd<T>(arr: T[]): T {
  const idx = new Uint32Array(1);
  crypto.getRandomValues(idx);
  return arr[idx[0] % arr.length];
}

function genFullName():  string { return `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`; }
function genUsername():  string {
  const first = rnd(FIRST_NAMES).toLowerCase();
  const last  = rnd(LAST_NAMES).toLowerCase();
  const num   = new Uint32Array(1); crypto.getRandomValues(num);
  const n     = num[0] % 100;
  const patterns = [`${first}.${last}`, `${first}${last}`, `${first}_${last}${n}`, `${first[0]}${last}${n}`];
  return rnd(patterns).replace(/\s/g, "");
}
function genEmail(first?: string, last?: string): string {
  const f = (first ?? rnd(FIRST_NAMES)).toLowerCase().replace(/\s/g, "");
  const l = (last  ?? rnd(LAST_NAMES)).toLowerCase().replace(/\s/g, "");
  const d = rnd(DOMAINS);
  const patterns = [`${f}.${l}@${d}`, `${f}${l}@${d}`, `${f[0]}${l}@${d}`];
  return rnd(patterns);
}
function genPhone(): string {
  const arr = new Uint32Array(9); crypto.getRandomValues(arr);
  const num = Array.from(arr).map(v => v % 10);
  return `+44 7${num[0]}${num[1]}${num[2]} ${num[3]}${num[4]}${num[5]}${num[6]}${num[7]}${num[8]}`;
}
function genAddress(): string {
  const arr = new Uint32Array(2); crypto.getRandomValues(arr);
  const num = (arr[0] % 200) + 1;
  const pc1 = String.fromCharCode(65 + arr[1] % 26) + String.fromCharCode(65 + (arr[1] >> 8) % 26);
  const pArr = new Uint32Array(3); crypto.getRandomValues(pArr);
  const pc   = `${pc1}${(pArr[0] % 9) + 1} ${(pArr[1] % 9) + 1}${String.fromCharCode(65 + pArr[2] % 26)}${String.fromCharCode(65 + (pArr[2] >> 8) % 26)}`;
  return `${num} ${rnd(STREETS)}, ${rnd(CITIES)}, ${pc}, ${rnd(COUNTRIES)}`;
}
function genFullUser(): string {
  const first = rnd(FIRST_NAMES);
  const last  = rnd(LAST_NAMES);
  return JSON.stringify({
    name:     `${first} ${last}`,
    email:    genEmail(first, last),
    username: genUsername(),
    phone:    genPhone(),
    company:  rnd(COMPANIES),
    title:    rnd(JOB_TITLES),
    address:  genAddress(),
  }, null, 2);
}

const GENERATORS: Record<DataType, { fn: () => string; label: string }> = {
  "full-name":  { fn: genFullName,  label: "Full Name"  },
  "email":      { fn: genEmail,     label: "Email"      },
  "username":   { fn: genUsername,  label: "Username"   },
  "phone":      { fn: genPhone,     label: "Phone"      },
  "address":    { fn: genAddress,   label: "Address"    },
  "company":    { fn: () => rnd(COMPANIES),    label: "Company"    },
  "job-title":  { fn: () => rnd(JOB_TITLES),   label: "Job Title"  },
  "full-user":  { fn: genFullUser,  label: "Full User (JSON)" },
};

export function DataGenerator() {
  const [type,   setType]   = useState<DataType>("full-user");
  const [count,  setCount]  = useState(5);
  const [values, setValues] = useState<string[]>([]);

  const generate = useCallback(() => {
    const gen = GENERATORS[type];
    setValues(Array.from({ length: count }, () => gen.fn()));
  }, [type, count]);

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Data Type" />
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(GENERATORS) as [DataType, { label: string }][]).map(([id, { label }]) => (
            <button key={id} onClick={() => setType(id)}
              className={`text-xs font-bold px-3 py-2.5 rounded-sm border text-left transition-all ${
                type === id
                  ? "bg-violet-900/30 border-violet-600 text-violet-300"
                  : "bg-stone-900/20 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader label="Quantity" />
        <SliderControl label={`Generate ${count} ${GENERATORS[type].label}${count !== 1 ? "s" : ""}`}
          value={count} min={1} max={type === "full-user" ? 20 : 100} onChange={setCount} />
      </div>

      <GenerateButton onClick={generate} label={`Generate ${count} ${GENERATORS[type].label}${count !== 1 ? "s" : ""}`} />

      {values.length > 0 && (
        type === "full-user" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{values.length} users</span>
              <button onClick={() => {
                const blob = new Blob([`[${values.join(",\n")}]`], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "users.json"; a.click();
                URL.revokeObjectURL(url);
              }} className="text-[10px] font-bold text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-2.5 py-1 rounded-sm transition-colors">
                Export JSON
              </button>
            </div>
            <div className="bg-stone-950 border border-stone-700 rounded-sm overflow-hidden max-h-72 overflow-y-auto">
              <pre className="text-xs text-emerald-400 font-mono p-4 leading-relaxed">
                {`[\n${values.join(",\n")}\n]`}
              </pre>
            </div>
          </div>
        ) : (
          <OutputList values={values} />
        )
      )}

      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS / Faker",
          code: `// Using @faker-js/faker\nimport { faker } from '@faker-js/faker';\n\nconst user = {\n  name:    faker.person.fullName(),\n  email:   faker.internet.email(),\n  phone:   faker.phone.number(),\n  address: faker.location.streetAddress(true),\n  company: faker.company.name(),\n};\n\n// Bulk (${count} users)\nconst users = Array.from({ length: ${count} }, () => ({\n  name:  faker.person.fullName(),\n  email: faker.internet.email(),\n}));`,
        },
        {
          lang: "py", label: "Python / Faker",
          code: `from faker import Faker\nfake = Faker('en_GB')\n\nuser = {\n    'name':    fake.name(),\n    'email':   fake.email(),\n    'phone':   fake.phone_number(),\n    'address': fake.address(),\n}\n\n# Bulk\nusers = [{'name': fake.name(), 'email': fake.email()} for _ in range(${count})]`,
        },
      ]} />
    </div>
  );
}