import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, BookOpen, Layers, BrainCircuit, AlertTriangle, 
  Check, Plus, List, TextCursorInput, AlignLeft, BarChart, 
  Clock, Trash2, Edit3, 
  MousePointerClick,
  SquareCheckBig,
  SquarePen,
  Brain,
  RotateCcw,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Załóżmy standardową ścieżkę shadcn
import { description } from '../ScoreChart';
import {v4 as uuidv4} from "uuid"
import { TopicType } from './QuizLayout';





const NAV_ITEMS = [
  { id: 'topics', label: 'Quiz Topics', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'formats', label: 'Question Types', icon: <Layers className="w-4 h-4" /> },
  { id: 'study', label: 'Study Optimization', icon: <Brain className="w-4 h-4" /> },
  { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> }
];


const QUESTION_TYPES = [
  { id: 'mc', name: 'Multiple Choice', description: "Classic format with answer choices", icon: <MousePointerClick className="w-4 h-4" /> },
  { id: 'fb', name: 'True or False', description: "True or False questions", icon: <SquareCheckBig className="w-4 h-4" /> },
  { id: 'sa', name: 'Short Answer', description: "You have to write a short answer", icon: <SquarePen className="w-4 h-4" /> }
];



// Niestandardowy Switch dla zachowania niezależności (możesz podmienić na ten z shadcn)
const CustomSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-blue-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

type QuizSettingsDialogProps = {
    selectedTopics: string[],
    onSetSelectedTopics: (value: string[]) => void,
    selectedTypes: string[],
    onSetSelectedTypes: (value: string[]) => void,
    topics: TopicType[] | null,
    onSetTopics: (value: TopicType[] | null) => void,
    spacedRepetition: boolean,
    onSetSpacedRepetition: (value: boolean) => void,
    immediateFeedback: boolean,
    onSetImmediateFeedback: (value: boolean) => void,
    timeLimit: boolean,
    onSetTimeLimit: (value: boolean) => void,  
    onResetProgress: () => void

}

export function QuizSettingsDialog({
    selectedTopics,
    onSetSelectedTopics,
    selectedTypes,
    onSetSelectedTypes,
    topics,
    onSetTopics,   
    spacedRepetition,
    onSetSpacedRepetition,
    immediateFeedback,
    onSetImmediateFeedback,
    timeLimit,
    onSetTimeLimit,   
    onResetProgress


} : QuizSettingsDialogProps) {
    // Stany interakcji
    const [activeSection, setActiveSection] = useState('topics');
    const [isOpen, setIsOpen] = useState(false); // <--- DODAJ TO
    
    const [editingTopic, setEditingTopic] = useState<TopicType | null>(null)

    const [isAddingNewTopic, setIsAddingNewTopic] = useState<boolean>(false)
    const [emptyTopic, setEmptyTopic] = useState<TopicType>({
        id: uuidv4(),
        name: "",
        description: "",
        difficulty: 'Medium',
        accuracy: "0%"
    })

    // STAN WALIDACJI (NOWE)
    const [validationErrors, setValidationErrors] = useState({ name: false, description: false });    


    // Referencje do sekcji i kontenera (ScrollSpy & Smooth Scroll)
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);

    // Implementacja ScrollSpy
    useEffect(() => {

    if(!isOpen) return

    let observer: IntersectionObserver;

    const timeoutId = setTimeout(() => {
        observer = new IntersectionObserver(
        (entries) => {
            // Filtrujemy tylko te sekcje, które przecinają nasz root (prawą kolumnę)
            entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActiveSection(entry.target.id);
                // console.log("sekcja: ", entry.target.id);
                
            }
            });
        },
        {
            root: scrollContainerRef.current,
            rootMargin: "-10% 0px -60% 0px", // Margines pozwalający na aktywację gdy sekcja mija górę ekranu
        }
        );

        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        })
    }, 50)

    // Sprzątanie (odpięcie observera) przy zamykaniu modala
    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [isOpen]);



    const scrollToSection = (id: string) => {
        const section = sectionRefs.current.find((ref) => ref?.id === id);
        if (section && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
            top: section.offsetTop - 50,
            behavior: 'smooth'
        });
        }
    };

    const toggleTopic = (id: string) => {
        const newTopics = selectedTopics.includes(id) ? selectedTopics.filter(t => t !== id) : [...selectedTopics, id];
        onSetSelectedTopics(newTopics);
    };

    const toggleType = (id: string) => {
        const newTypes = selectedTypes.includes(id) ? selectedTypes.filter(t => t !== id) : [...selectedTypes, id];
        onSetSelectedTypes(newTypes);
    };

    // FUNKCJA WALIDUJĄCA FORMULARZ
    const validateForm = (name: string | undefined, description: string | undefined) => {
        const isNameEmpty = !name || name.trim() === "";
        const isDescEmpty = !description || description.trim() === "";
        
        setValidationErrors({
            name: isNameEmpty,
            description: isDescEmpty
        });

        return !isNameEmpty && !isDescEmpty;
    };  

  return (
    <>

    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={
            <button className="flex gap-1 p-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full 
                active:scale-[0.97] transition-all duration-200">                     
                <Settings className="w-6 h-6" />                     
                <span>Quiz Settings</span>                 
            </button>
        }>
        </DialogTrigger>

        {/* Modyfikacja p-0 by kontrolować układ samodzielnie, max-w-4xl dla szerokości */}
        <DialogContent className="!max-w-4xl !p-0 !m-0 gap-0 overflow-hidden bg-white flex h-[80vh] min-h-[600px] border-slate-200 rounded-2xl shadow-2xl">
            
            {/* LEWA KOLUMNA: Nawigacja */}
            <div className="w-[28%] bg-white flex flex-col py-8 px-4 ">
            <div className="mb-8 px-2">
                <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Improve your learning experience.</p>
            </div>

            <nav className="w-full space-y-1 ">
                {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                    <button
                    key={item.id}
                    onClick={() => {
                        setActiveSection(item.id)
                        scrollToSection(item.id)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[9px] transition-all duration-200 text-sm font-medium ${
                        isActive 
                        ? 'bg-blue-50 text-blue-800' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    >
                    {item.icon}
                    {item.label}
                    </button>
                );
                })}
            </nav>
            </div>

            {/* PRAWA KOLUMNA: Zawartość */}
            <div 
            ref={scrollContainerRef}
            className="w-[72%] p-0 m-0 bg-slate-50/50  border-l border-slate-100 overflow-y-auto relative scroll-smooth
                    [&::-webkit-scrollbar]:w-[5px]
                    [&::-webkit-scrollbar]:h-[5px]
                    [&::-webkit-scrollbar-track]:bg-gray-100
                    [&::-webkit-scrollbar-thumb]:bg-gray-300
                    [&::-webkit-scrollbar-thumb]:rounded-[4px]          
            " 
            >
            <div className="pt-10 px-7 space-y-16">
                
                {/* 1. QUIZ TOPICS */}
                <section 
                id="topics" 
                ref={(el) => {
                    sectionRefs.current[0] = el;
                }}
                className="space-y-6"
                >
                <div>
                    <h3 className="text-xl font-semibold text-slate-900">Quiz Topics</h3>
                    <p className="text-sm text-slate-500 mt-1">Select the subjects you want to include in your next session or let AI generate them for you.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {topics && topics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                        <div 
                            key={topic.id}
                            onClick={() => toggleTopic(topic.id)}
                            className={`p-4 rounded-[9px] cursor-pointer transition-all duration-200 border-2 active:translate-y-[2px] ${
                                isSelected 
                                ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50 shadow-[2px_2px_0px_#e5e7eb]'
                            }`}
                        >
                            <div className="flex justify-between gap-2 items-start mb-4">
                                <span className="font-semibold text-slate-900 leading-tight break-words ">{topic.name}</span>

                                <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </div>

                            <div className="flex flex-wrap mt-auto justify-between">
                                <div className="flex gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                        <BarChart className="w-3 h-3" />
                                        {topic.difficulty}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                        <Check className="w-3 h-3" />
                                        {topic.accuracy}
                                    </span>
                                </div>

                                {/* Subtelna ikona edycji */}
                                <button 
                                    className="mt-4 text-slate-400 hover:text-blue-600 transition-colors"
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        setEditingTopic(topic)
                                    }}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>                                 
                            </div>
                        

                        </div>
                    )
                    })}

                    {/* Karta Add New Topic */}
                    <button 
                        onClick={() => setIsAddingNewTopic(true)}
                        className="flex flex-col items-center justify-center p-4 rounded-[9px] border-2 border-dashed border-slate-300 bg-transparent hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 group text-slate-500">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-slate-200 transition-colors">
                            <Plus className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="font-medium text-sm">Create New Topic</span>
                    </button>
                </div>
                </section>

                {/* 2. QUESTION TYPES */}
                <section 
                id="formats" 
                ref={(el) => {sectionRefs.current[1] = el}}
                className="space-y-6"
                >
                <div>
                    <h3 className="text-xl font-semibold text-slate-900">Question Types</h3>
                    <p className="text-sm text-slate-500 mt-1">Mix up your testing formats for better memory encoding.</p>
                </div>
                
                <div className="flex gap-3">
                    {QUESTION_TYPES.map((type) => {
                    const isSelected = selectedTypes.includes(type.id);
                    return (
                        <div 
                            key={type.id}
                            onClick={() => toggleType(type.id)}
                            className={`flex items-center  p-3 rounded-[9px] cursor-pointer transition-all border-2 
                                active:translate-y-[2px] ${
                                isSelected
                                ? 'border-blue-600 bg-blue-50/50'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-[2px_2px_0px_#e5e7eb] '
                            }`}
                            >
                            <div className="flex-1 flex flex-col">
                                <div className={`w-fit mb-2 p-2 rounded-[9px] ${isSelected ? 'text-blue-600 bg-blue-100' : 'text-slate-500 bg-slate-100'}`}>
                                    {type.icon}
                                </div>

                                <span className="flex-1 font-semibold text-slate-900 leading-tight">{type.name}</span>     

                                <span className="font-normal text-slate-500 text-[12px]">{type.description}</span>                       
                            </div>

                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                            }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                        </div>
                    )
                    })}
                </div>
                </section>

                {/* 3. STUDY OPTIONS (Retencja) */}
                <section 
                id="study" 
                ref={(el) => {sectionRefs.current[2] = el}}
                className="space-y-6"
                >
                <div>
                    <h3 className="text-xl font-semibold text-slate-900">Study Optimization & Retention</h3>
                    <p className="text-sm text-slate-500 mt-1">Advanced cognitive toggles to maximize your learning sessions.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-2">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="pr-8">
                        <h4 className="font-medium text-slate-900 mb-1">Spaced Repetition Mode</h4>
                        <p className="text-sm text-slate-500">Algorithm prioritizes questions you struggled with in the past to strengthen weaker neural pathways.</p>
                    </div>
                    <CustomSwitch checked={spacedRepetition} onChange={() => onSetSpacedRepetition(!spacedRepetition)} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="pr-8">
                        <h4 className="font-medium text-slate-900 mb-1">Immediate Feedback</h4>
                        <p className="text-sm text-slate-500">Show correct answers and explanations right after selection, rather than at the end of the quiz.</p>
                    </div>
                    <CustomSwitch checked={immediateFeedback} onChange={() => onSetImmediateFeedback(!immediateFeedback)} />
                    </div>

                    <div className="flex items-center justify-between p-4">
                    <div className="pr-8">
                        <h4 className="font-medium text-slate-900 mb-1 flex items-center gap-2">
                        Time Limit per Question
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            <Clock className="w-3 h-3 mr-1" />
                            Hardcore
                        </span>
                        </h4>
                        <p className="text-sm text-slate-500">Forces faster recall which builds stronger and more permanent memory traces.</p>
                    </div>
                    <CustomSwitch checked={timeLimit} onChange={() => onSetTimeLimit(!timeLimit)} />
                    </div>
                </div>
                </section>

                {/* 4. DANGER ZONE */}
                <section 
                id="danger" 
                ref={(el) => {sectionRefs.current[3] = el}}
                className="space-y-6" // Dodatkowa przestrzeń nad Danger Zone
                >
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">Danger Zone</h3>
                        <p className="text-sm text-slate-500 mt-1">This section contains actions that cannot be undone. Proceed with caution.</p>
                    </div>

                    <div className="bg-red-50/50 border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-800" />
                            Reset Quiz Progress
                        </h3>
                        <p className="text-sm text-red-700/70 mb-6 max-w-md">
                            Resetting your progress will permanently delete your historical accuracy metrics and spaced repetition data.
                        </p>

                        <button
                            onClick={() => {
                                onResetProgress()
                                setIsOpen(false)
                            }} 
                            className="flex items-center gap-2 px-4 py-2 rounded-[9px] bg-red-600  text-white font-medium
                        hover:bg-red-600/80 transition-all active:scale-[0.97] shadow-sm duration-200">
                            <RotateCcw className="w-4 h-4" />
                            Reset Progress
                        </button>
                    </div>

                </section>
                
                {/* Dodatkowy padding na dole, aby ostatnia sekcja mogła doscrollować wyżej */}
                <div className="h-50"></div>
            </div>
            </div>
        </DialogContent>

        </Dialog>

        {/* ======================= MODAL EDYCJI TEMATU ======================= */}
        <Dialog 
            open={!!editingTopic} 
            onOpenChange={(isOpen) => {
                if(!isOpen) {
                    setEditingTopic(null);
                    setValidationErrors({name: false, description: false});
                }
            }}
        >
            <DialogContent className="z-[999] max-w-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-900">Edit Topic</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Topic Title</label>
                        <input 
                            type="text" 
                            value={editingTopic?.name || ""} 
                            onChange={(e) => {
                                setEditingTopic((prev) => prev ? {...prev, name: e.target.value} : prev);
                                if(validationErrors.name) setValidationErrors(prev => ({...prev, name: false}));
                            }}
                            className={`w-full p-2 mt-1 border-1 rounded-[9px] outline-none transition-colors shadow-[2px_2px_0px_#e5e7eb] focus:ring-2 ${
                                validationErrors.name 
                                ? 'border-red-600 bg-red-50/30 focus:ring-red-600' 
                                : 'border-slate-300 focus:ring-blue-600'
                            }`}
                        />
                        {validationErrors.name && <p className="text-xs text-red-600 mt-1">Topic title is required.</p>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700">Topic Description</label>
                            <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Generate new description
                            </button>
                        </div>
                        <textarea 
                            value={editingTopic?.description || ""} 
                            onChange={(e) => {
                                setEditingTopic((prev) => prev ? {...prev, description: e.target.value} : prev);
                                if(validationErrors.description) setValidationErrors(prev => ({...prev, description: false}));
                            }}
                            className={`w-full p-3 mt-1 border-1 rounded-[9px] min-h-[120px] text-sm shadow-[2px_2px_0px_#e5e7eb] outline-none resize-none transition-colors focus:ring-2 ${
                                validationErrors.description 
                                ? 'border-red-600 bg-red-50/30 focus:ring-red-600' 
                                : 'border-slate-300 focus:ring-blue-600'
                            }`}
                        />
                        {validationErrors.description && <p className="text-xs text-red-600 mt-1">Topic description is required.</p>}
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={() => {
                            if (editingTopic && topics) {
                                onSetTopics(topics.filter((topic: TopicType) => topic.id !== editingTopic.id));
                            }
                            setEditingTopic(null);
                        }}
                        className="flex-1 px-4 py-2.5 border-slate-300 border-2 hover:bg-slate-200 hover:text-slate-900 bg-slate-50 cursor-pointer text-slate-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Topic
                    </button>
                    <button 
                        onClick={() => {
                            // WALIDACJA PRZED ZAPISEM
                            if (!validateForm(editingTopic?.name, editingTopic?.description)) return;

                            // onSetTopics expects an array, not an updater function. Use current `topics` value.
                            if (topics) {
                                onSetTopics(topics.map((topic: TopicType) => topic.id === editingTopic?.id ? editingTopic as TopicType : topic));
                            }
                            setEditingTopic(null);
                        }}
                        className="flex-1 px-4 py-2.5 cursor-pointer bg-blue-600 hover:bg-blue-600/85 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </DialogContent> 
        </Dialog>
        
        
        {/* ======================= MODAL DODAWANIA TEMATU ======================= */}
        <Dialog 
            open={isAddingNewTopic} 
            onOpenChange={(isOpen) => {
                if(!isOpen) {
                    setIsAddingNewTopic(false);
                    setValidationErrors({name: false, description: false});
                }
            }}
        >
            <DialogContent className="z-[999] max-w-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-900">Add New Topic</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Topic Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Mathematics, B2 Grammar..." 
                            value={emptyTopic.name} 
                            onChange={(e) => {
                                setEmptyTopic((prev) => ({...prev, name: e.target.value}));
                                if(validationErrors.name) setValidationErrors(prev => ({...prev, name: false}));
                            }}
                            className={`w-full p-2 mt-1 border-1 rounded-[9px] outline-none transition-colors shadow-[2px_2px_0px_#e5e7eb] focus:ring-2 ${
                                validationErrors.name 
                                ? 'border-red-600 bg-red-50/30 focus:ring-red-600' 
                                : 'border-slate-300 focus:ring-blue-600'
                            }`}
                        />
                        {validationErrors.name && <p className="text-xs text-red-600 mt-1">Topic title is required.</p>}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700">Topic Description</label>
                            <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Generate new description
                            </button>
                        </div>
                        <textarea 
                            placeholder="A short description of the topic..."
                            value={emptyTopic.description} 
                            onChange={(e) => {
                                setEmptyTopic((prev) => ({...prev, description: e.target.value}));
                                if(validationErrors.description) setValidationErrors(prev => ({...prev, description: false}));
                            }}
                            className={`w-full p-3 mt-1 border-1 rounded-[9px] min-h-[120px] text-sm shadow-[2px_2px_0px_#e5e7eb] outline-none resize-none transition-colors focus:ring-2 ${
                                validationErrors.description 
                                ? 'border-red-600 bg-red-50/30 focus:ring-red-600' 
                                : 'border-slate-300 focus:ring-blue-600'
                            }`}
                        />
                        {validationErrors.description && <p className="text-xs text-red-600 mt-1">Topic description is required.</p>}
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    {/* Zmiana Delete -> Cancel */}
                    <button 
                        onClick={() => {
                            setEmptyTopic({ id: uuidv4(), name: "", description: "", difficulty: 'Medium', accuracy: "0%" });
                            setIsAddingNewTopic(false);
                            setValidationErrors({name: false, description: false});
                        }}
                        className="flex-1 px-4 py-2.5 border-slate-300 border-2 hover:bg-slate-200 hover:text-slate-900 bg-slate-50 cursor-pointer text-slate-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" /> Cancel
                    </button>

                    <button 
                        onClick={() => {
                            // WALIDACJA PRZED ZAPISEM
                            if (!validateForm(emptyTopic.name, emptyTopic.description)) return;

                            onSetTopics(topics ? [...topics, emptyTopic] : [emptyTopic]);
                            
                            // Reset po udanym zapisie z nowym UUID
                            setEmptyTopic({ id: uuidv4(), name: "", description: "", difficulty: 'Medium', accuracy: "0%" });
                            setIsAddingNewTopic(false);
                            setValidationErrors({name: false, description: false});
                        }}
                        className="flex-1 px-4 py-2.5 cursor-pointer bg-blue-600 hover:bg-blue-600/85 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </DialogContent>        
        </Dialog>


    </>

    

  );
}