import React, { useState } from 'react';
import { 
  Settings, 
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  MoveLeft,
  MoveRight,
  Icon,
  Check,
  FileText,
  Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"


import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Button } from '@/components/ui/button';
import { Flashcard } from './FlashcardsLayout';



// Niestandardowy Switch zachowany w kolorystyce blue-600
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

type FlashcardsSettingsDialogProps = {
  onSetIsTrackingProgress: (value: boolean) => void,
  isTrackingProgress: boolean,
  onSetStarredOnly: (value: boolean) => void,
  starredOnly: boolean,
  isFlipped: boolean,
  onSetIsFlipped: (value: boolean) => void,
  onSetSettingsIsFlipOn: (value: boolean) => void,
  onSetIsAutoAudio: (value: boolean) => void,
  isAutoAudio: boolean,
  handleStartAgain: (value: boolean) => void
}

export function FlashcardsSettingsDialog({
  onSetIsTrackingProgress,
  isTrackingProgress,
  onSetStarredOnly,
  starredOnly,
  onSetIsFlipped,
  onSetSettingsIsFlipOn,
  onSetIsAutoAudio,
  isAutoAudio,
  handleStartAgain

}: FlashcardsSettingsDialogProps) {
  type SideKey = 'term' | 'definition';

  const [isOpen, setIsOpen] = useState(false);
  
  // Stany dla opcji
  const [side, setSide] = useState<Record<SideKey, boolean>>({
    term: true,
    definition: false,
  });
  const sideOptions: SideKey[] = ['term', 'definition'];
  const [showShortcuts, setShowShortcuts] = useState(false); // Stan do rozwijania skrótów

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <button
          className="flex gap-1 p-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full 
            active:scale-[0.97] transition-all duration-200">                     
            <Settings className="w-6 h-6" />                     
            <span>Cards Settings</span>                 
        </button>
      }>
      </DialogTrigger>

      {/* Czysty, nowoczesny modal w stylu Notium */}
      <DialogContent className="!max-w-[480px] !p-0 !m-0 gap-0 overflow-hidden bg-white border-slate-200 rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <DialogHeader className="px-6 py-5 border-b border-gray-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 tracking-tight">
            Options
          </DialogTitle>
        </DialogHeader>

        {/* LISTA OPCJI */}
        <div className="px-6 py-2 flex flex-col flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
          
            {/* Śledzenie postępów */}
            <div className="py-5 flex justify-between items-center gap-4">
                <div className="flex flex-col pr-4">
                <span className="text-[14.5px] font-medium text-gray-900">Track progress</span>
                <span className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                    Sort cards into "Learning" and "Mastered". Disable for a quick review.
                </span>
                </div>
                <CustomSwitch 
                  checked={isTrackingProgress} 
                  onChange={() => onSetIsTrackingProgress(!isTrackingProgress)}  
                />
            </div>

            {/* Opcja gwiazdek */}
            <div className="py-5 flex justify-between items-center gap-4">
                <span className="text-[14.5px] font-medium text-gray-900">Study starred terms only</span>
                <CustomSwitch 
                  checked={starredOnly} 
                  onChange={() => {       
                      const updatedStarredOnly = !starredOnly           
                      onSetStarredOnly(updatedStarredOnly)
                  }} 
                />
            </div>

            {/* Segmented Control - Wybór przodu fiszki */}
            <div className="flex items-center justify-between py-5">
                <span className="text-[14.5px] font-medium text-gray-900">Front of card</span>
                
                {/* Kontener przełącznika */}
                <div className="relative flex bg-neutral-200/50 p-1 rounded-lg">
                    {/* Pływające tło */}
                    <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        side.definition  ? "translate-x-full" : "translate-x-0"
                    }`}
                    />

                    {/* Przyciski */}
                    {sideOptions.map((option) => (
                    <button
                        key={option}
                        onClick={() => {
                            if (option === "term") {
                              onSetIsFlipped(false)
                              setSide((prev) => ({ ...prev, term: true, definition: false }))
                              onSetSettingsIsFlipOn(false)
                            } else {
                              onSetIsFlipped(true)
                              setSide((prev) => ({ ...prev, term: false, definition: true }))
                              onSetSettingsIsFlipOn(true)
                            }
                        }}
                        className={`relative z-10 w-20 cursor-pointer py-[6px] text-xs font-semibold rounded-md transition-colors duration-300 ${
                        side[option]
                            ? "text-neutral-900" 
                            : "text-neutral-500 hover:text-neutral-700" 
                        }`}
                    >
                        {option}
                    </button>
                    ))}
                </div>
            </div>

            {/* SKRÓTY KLAWISZOWE (Rozwijane) */}
            <div className="py-4 flex flex-col">
              <div 
                className="flex justify-between items-center cursor-pointer group"
                onClick={() => setShowShortcuts(!showShortcuts)}
              >
                <span className="text-[14.5px] font-medium text-gray-900 transition-colors">
                  Keyboard shortcuts
                </span>
                <div className="flex items-center gap-1 text-[13px] font-medium px-3 py-2
                text-neutral-500 group-hover:text-neutral-900 group-hover:bg-neutral-100 rounded-md 
                active:scale-[0.97] transition-all duration-200">
                  {showShortcuts ? 'Hide' : 'Show'}
                  {showShortcuts ? <ChevronUp className="w-4 h-4 ml-0.5" /> : <ChevronDown className="w-4 h-4 ml-0.5" />}
                </div>
              </div>
              
              {showShortcuts && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 mt-5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Lewa kolumna */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Previous</span>
                    <kbd className="h-7 w-7 min-w-[24px] px-1.5 flex items-center justify-center rounded border border-gray-200
                     bg-gray-50 text-xs font-semibold text-gray-600">
                        <MoveLeft size={17} className="text-gray-500 stroke-2"/>
                     </kbd>
                  </div>         

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Next</span>
                    <kbd className="h-7 w-7 min-w-[24px] px-1.5 flex items-center justify-center rounded border border-gray-200
                     bg-gray-50 text-xs font-bold text-gray-600">
                        <MoveRight size={17} className="text-gray-500"/>
                     </kbd>
                  </div> 

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Flip</span>
                    <kbd className="h-7 w-fit min-w-[24px] px-1.5 flex items-center justify-center rounded border border-gray-200
                     bg-gray-50 text-xs text-gray-600">
                        <span className="text-gray-500 font-bold">SPACE</span>
                     </kbd>
                  </div>  

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Favorite</span>
                    <kbd className="h-7 w-fit min-w-[24px] px-1.5 flex items-center justify-center rounded border border-gray-200
                     bg-gray-50 text-xs font-bold text-gray-600">
                        <span className="text-gray-500">F</span>
                     </kbd>
                  </div>   

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Edit</span>
                    <kbd className="h-7 w-fit min-w-[24px] px-1.5 flex items-center justify-center rounded border border-gray-200
                     bg-gray-50 text-xs font-bold text-gray-600">
                        <span className="text-gray-500">E</span>
                     </kbd>
                  </div>            

                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Shuffle</span>
                    <kbd className="h-7 w-fit min-w-[24px] px-1.5 flex items-center justify-center rounded border border-gray-200
                     bg-gray-50 text-xs font-bold text-gray-600">
                        <span className="text-gray-500">S</span>
                     </kbd>
                  </div>
              

                </div>
              )}
            </div>

          {/* Syntezator mowy */}
          <div className="py-5 flex justify-between items-center gap-4">
            <span className="text-[14.5px] font-medium text-gray-900">Text-to-speech audio</span>
            <CustomSwitch checked={isAutoAudio} onChange={() => 
                onSetIsAutoAudio(!isAutoAudio)
              } />
          </div>

        </div>

        {/* DOLNE GUZIKI AKCJI */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 flex flex-col gap-2.5 mt-auto shrink-0">
          
            <Popover>
                <PopoverTrigger render={
                    <button className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700
                    rounded-xl text-[14px] font-medium hover:bg-gray-50 hover:text-gray-900  transition-all active:scale-[0.98] cursor-pointer">
                        <Download className="w-[18px] h-[18px] text-gray-400" />
                        Export Flashcards
                    </button>
                }/>

                <PopoverContent sideOffset={5} className="w-[calc(480px-45px)]  !max-w-[480px] border-1 !p-1">

                    <Item className="hover:bg-gray-100 transition-all duration-150 cursor-pointer">
                        <ItemMedia variant="icon">
                            <FileText className="!w-5 !h-5 stroke-1.5 text-gray-700"/>                          
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>Export to Pdf</ItemTitle>
                            <ItemDescription>Save your flashcards in printable pdf.</ItemDescription>
                        </ItemContent>
                    </Item>

                    <Item className="hover:bg-gray-100 transition-all duration-150 cursor-pointer">
                        <ItemMedia variant="icon">
                            <div className="w-6 h-6 bg-[#4255FF] flex items-center justify-center">
                                <Search size={14} className="stroke-3 text-white"/>
                            </div>
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>Export to Quizlet</ItemTitle>
                            <ItemDescription>Copy your flashcards to clipboard.</ItemDescription>
                        </ItemContent>
                    </Item>


                </PopoverContent>
            </Popover>
                
            <button
              onClick={() => {
                handleStartAgain(true)
              }} 
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-red-600/90 
            text-white rounded-xl shadow-[0px_3px_0px_#B91C1C] text-[14px] font-medium hover:bg-red-600/80 transition-all
                active:translate-y-[3px] active:shadow-none cursor-pointer">
                <RotateCcw className="w-[18px] h-[18px]" />
                Reset Progress
            </button>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}