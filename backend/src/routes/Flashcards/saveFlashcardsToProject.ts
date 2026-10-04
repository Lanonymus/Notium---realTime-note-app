import { eq } from "drizzle-orm";
import { db } from "../../db/db.js";
import { FlashcardsSet, projects } from "../../db/schema.js";



export async function saveFlashcardsToProject(projectId: string, newFlashcardsSet: FlashcardsSet) {

    // pobieranie aktualnych danych o projekcie dotyczących setów fiszek
    const [project] = await db
        .select({
            resources: projects.resources,
            flashcardSets: projects.flashcardSets
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

    if(!project) {
        throw new Error("Nie znaleziono fiszek w projekcie!!")
    }

    // dodawanie flagi że projekt ma quiz
    const updatedResources = {
        ...project.resources,
        hasFlashcards: true
    }

    // Dodajemy nowy quiz do tablicy
    const currentFlashcardSets = (project.flashcardSets as FlashcardsSet[] || [])
    const updatedFlashcardSets = [...currentFlashcardSets, newFlashcardsSet]

    // aktualizacja - dodanie nowego setu fiszek do poprzednich w projkecie i aktualizacja listy
    await db
        .update(projects)
        .set({
            resources: updatedResources,
            flashcardSets: updatedFlashcardSets,
            updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
}