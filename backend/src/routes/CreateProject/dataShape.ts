import { z } from "zod";
import { learningSkills } from "./data.js";


export const skillSchema = z.enum(learningSkills);

export const generatedNoteSchema = z.object({
  icon: z.string().min(1).max(8),
  title: z.string().min(1).max(40),
  coverPrompt: z.string().min(1),
  htmlContent: z.string().min(1),
  skills: z.array(skillSchema).min(1).max(3),
});
