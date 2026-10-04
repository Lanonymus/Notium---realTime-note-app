import { eq } from "drizzle-orm";
import { db } from "../../db/db.js";
import { Podcast, projects } from "../../db/schema.js";


export async function savePodcastToProject(projectId: string, podcast: Podcast) {

    const [project] = await db
        .select({
            resources: projects.resources,
            podcasts: projects.podcasts
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

    if(!project) {
        throw new Error("Nie znaleziono dla zapisu podkastu projektu!!")
    }

    // dodawanie flagi że projekt ma quiz
    const updatedResources = {
        ...project.resources,
        hasPodcast: true
    }

    // Dodajemy nowy quiz do tablicy
    const currentPodcasts = (project.podcasts as Podcast[] || [])
    const updatedPodcasts = [...currentPodcasts, podcast]

    await db
        .update(projects)
        .set({
            resources: updatedResources,
            podcasts: updatedPodcasts,
            updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
}