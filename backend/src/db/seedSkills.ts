import { db } from "./db.js";
import { skillCatalog } from "./schema.js";

const skills = [
  { key: "argument-analysis", label: "Argument Analysis", category: "analytical" },
  { key: "logical-deduction", label: "Logical Deduction", category: "analytical" },
  { key: "critical-reading", label: "Critical Reading", category: "analytical" },
  { key: "evidence-evaluation", label: "Evidence Evaluation", category: "analytical" },
  { key: "bias-detection", label: "Bias Detection", category: "analytical" },
  { key: "causal-reasoning", label: "Causal Reasoning", category: "analytical" },
  { key: "comparative-analysis", label: "Comparative Analysis", category: "analytical" },
  { key: "root-cause-analysis", label: "Root Cause Analysis", category: "analytical" },
  { key: "pattern-recognition", label: "Pattern Recognition", category: "analytical" },
  { key: "problem-decomposition", label: "Problem Decomposition", category: "analytical" },

  { key: "scientific-method", label: "Scientific Method", category: "scientific" },
  { key: "hypothesis-testing", label: "Hypothesis Testing", category: "scientific" },
  { key: "experimental-design", label: "Experimental Design", category: "scientific" },
  { key: "statistical-analysis", label: "Statistical Analysis", category: "scientific" },
  { key: "probability-reasoning", label: "Probability Reasoning", category: "scientific" },
  { key: "data-interpretation", label: "Data Interpretation", category: "scientific" },
  { key: "mathematical-modeling", label: "Mathematical Modeling", category: "scientific" },
  { key: "algorithmic-thinking", label: "Algorithmic Thinking", category: "scientific" },
  { key: "systems-modeling", label: "Systems Modeling", category: "scientific" },
  { key: "technical-literacy", label: "Technical Literacy", category: "scientific" },

  { key: "cultural-analysis", label: "Cultural Analysis", category: "humanistic" },
  { key: "historical-analysis", label: "Historical Analysis", category: "humanistic" },
  { key: "literary-analysis", label: "Literary Analysis", category: "humanistic" },
  { key: "philosophical-reasoning", label: "Philosophical Reasoning", category: "humanistic" },
  { key: "ethical-reasoning", label: "Ethical Reasoning", category: "humanistic" },
  { key: "social-analysis", label: "Social Analysis", category: "humanistic" },
  { key: "political-analysis", label: "Political Analysis", category: "humanistic" },
  { key: "language-analysis", label: "Language Analysis", category: "humanistic" },
  { key: "media-literacy", label: "Media Literacy", category: "humanistic" },
  { key: "source-criticism", label: "Source Criticism", category: "humanistic" },

  { key: "strategic-planning", label: "Strategic Planning", category: "strategic" },
  { key: "decision-making", label: "Decision Making", category: "strategic" },
  { key: "risk-assessment", label: "Risk Assessment", category: "strategic" },
  { key: "market-analysis", label: "Market Analysis", category: "strategic" },
  { key: "marketing-strategy", label: "Marketing Strategy", category: "strategic" },
  { key: "financial-analysis", label: "Financial Analysis", category: "strategic" },
  { key: "project-planning", label: "Project Planning", category: "strategic" },
  { key: "process-optimization", label: "Process Optimization", category: "strategic" },
  { key: "product-thinking", label: "Product Thinking", category: "strategic" },
  { key: "negotiation", label: "Negotiation", category: "strategic" },

  { key: "creative-thinking", label: "Creative Thinking", category: "creative" },
  { key: "idea-generation", label: "Idea Generation", category: "creative" },
  { key: "storytelling", label: "Storytelling", category: "creative" },
  { key: "persuasive-writing", label: "Persuasive Writing", category: "creative" },
  { key: "visual-communication", label: "Visual Communication", category: "creative" },
  { key: "design-thinking", label: "Design Thinking", category: "creative" },
  { key: "written-communication", label: "Written Communication", category: "creative" },
  { key: "information-synthesis", label: "Information Synthesis", category: "creative" },
  { key: "knowledge-organization", label: "Knowledge Organization", category: "creative" },
  { key: "memory-retention", label: "Memory Retention", category: "creative" },
];

export async function seedSkills() {
  await db
    .insert(skillCatalog)
    .values(skills)
    .onConflictDoNothing({
      target: skillCatalog.key,
    });

  console.log("Skill catalog seeded");
}
