import express from "express";
import { eq } from "drizzle-orm";
import AuthTokenMiddleware from "../../controllers/AuthTokenMiddleware.js";
import { db } from "../../db/db.js";
import { projects } from "../../db/schema.js";
import {
  extractNotes,
} from "./scenarioCore.js";

const extractFilesRouter = express.Router();


extractFilesRouter.post("/extractFiles", AuthTokenMiddleware, async (req, res) => {

    const userId = (req as typeof req & { userId?: string }).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Please sign in." });
      return;
    }

    // dane z frontendu
    const { projectId } = req.body;
    
    try {
      // UWAGA: zapytanie z przesłanego pliku sprawdza tylko ID projektu.
      // Dodaj tutaj swój istniejący warunek właściciela/członkostwa;
      // AuthTokenMiddleware potwierdza logowanie, nie dostęp do tego projektu.
      const [project] = await db
        .select({ editorContent: projects.editorContent })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        res.status(404).json({ success: false, message: "Project not found." });
        return;
      }
      

      let notes = "";

      try {
        notes = extractNotes(project.editorContent)
      } catch (error) {
        console.error("Error extracting notes:", error);
      }




      return res.status(200).json({
        success: true,
        notes,
      });


    } catch (error) {
      
      console.error("No resources provided")
      res
        .status(502)
        .json({
          success: false,
          message: "No resources provided",
        });
    }
  },
);
export default extractFilesRouter;
