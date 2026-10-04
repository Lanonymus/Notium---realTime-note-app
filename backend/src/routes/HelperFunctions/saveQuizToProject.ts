import { eq } from "drizzle-orm";
import { db } from "../../db/db.js";
import { projects, QuizInstance } from "../../db/schema.js";


// --- TYPES ---
export type QuizState = 'ready' | 'active' | 'finished';



export async function saveQuizToProject(projectId: string, newQuiz: QuizInstance) {

    const [project] = await db
        .select({
            resources: projects.resources,
            quizes: projects.quizes
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

    if(!project) {
        throw new Error("Nie znaleziono projektu!!")
    }

    // dodawanie flagi że projekt ma quiz
    const updateResources = {
        ...project.resources,
        hasQuiz: true
    }

    // Dodajemy nowy quiz do tablicy
    const currentQuizes = (project.quizes as QuizInstance[] || [])
    const updatedQuizes = [...currentQuizes, newQuiz]

    await db
        .update(projects)
        .set({
            resources: updateResources,
            quizes: updatedQuizes,
            updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
}