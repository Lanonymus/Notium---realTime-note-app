import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore: allow CSS import side effect without type declarations
import './index.css'
import JoinRoom from './JoinRoom.js'
import { TooltipProvider } from "@/components/ui/tooltip.js"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import TipTapEditor from './TiptapEditor.js';
import { AppSidebar } from './components/AppSidebar.js';
import ProjectLayout from './components/ProjectLayout.js';
import Dashboard from './components/Dashboard/Dashboard.js';
import NotesLayout from './components/Notes/NotesLayout.js';
import QuizLayout from './components/Quiz/QuizLayout.js';
import FlashcardsLayout from './components/Flashcards/FlashcardsLayout.js';
import PodcastLayout from './components/Podcast/PodcastWorkspace.js';
import PodcastMain from './components/Podcast/PodcastLayout.js';
import LandingPageLayout from './components/LandingPage/LandingPageLayout.js';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/" element={<LandingPageLayout/>}/>

          {/* Zagnieżdżone ścieżki dla projektu */}
          <Route path="/project/:projectID" element={<ProjectLayout/>}>
             {/* Domyślne przekierowanie na notes po wejściu w samo /project/:projectID */}
             <Route index element={<Navigate to="notes" replace />} />
             
             {/* Poszczególne zakładki */}
             <Route path="notes" element={<NotesLayout/>}/>
             <Route path="quiz" element={
                <div className="overflow-y-hidden w-full h-screen">
                  <QuizLayout/>
                </div>
              }/>
             <Route path="flashcards" element={<FlashcardsLayout/>}/>  
             <Route path="podcast" element={<PodcastMain/>}/>    

          </Route>

          <Route path="/register" element={<JoinRoom/>}/>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>,
)
