import { useRef, useState, RefObject, useEffect, Ref } from "react";
import { Maximize2, ArrowRight, Mic, Paperclip, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"


// Chat ai i wiadomości
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { v4 as uuidv4 } from "uuid"
import { Spinner } from "@/components/ui/spinner";
import { Editor } from "@tiptap/core"
import { DOMParser, Slice } from "@tiptap/pm/model"


type ChatMessage = {
  id: string,
  content: string,
  role: string
}

type InlineAiChatProps = {
    editor: Editor,
    aiContextText: string,
    userSelectedContent: Slice | null,
    showInlineAiBubble: boolean,
    openInlineAiBubble: () => void,
    closeInlineAiBubble: () => void,
    newContext: RefObject<string>
}

export default function InlineAiChat({ editor, aiContextText, userSelectedContent, showInlineAiBubble, openInlineAiBubble, closeInlineAiBubble, newContext } : InlineAiChatProps ) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [userPrompt , setUserPrompt] = useState<string>("")
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const inlineInputRef = useRef<HTMLTextAreaElement>(null)
    const lastUsedPrompt = useRef<string>("")
    const generateFnRef = useRef<any>(null)
    const inlineAiChatRef = useRef<HTMLDivElement | null>(null)


    // po każdym renderze aktualizujemy do najnowszej wersji funkcji
    useEffect(() => {
        generateFnRef.current = handleGenerateContent
    })


    // Ponowne generowanie
    useEffect(() => {
        const handleRetry = (event: Event) => {
            console.log("🔁 próba ponowienia generacji");
            
            const customEvent = event as CustomEvent
            if(customEvent.detail.newContext) {
                newContext.current = customEvent.detail.newContext;

            }

            if(generateFnRef.current) {
                generateFnRef.current(true)
            }
        }

        setTimeout(() => {
            window.addEventListener('retry-ai-generation', handleRetry)
        }, 0);

        return () => {
            window.removeEventListener('retry-ai-generation', handleRetry)
        }
    }, [])
    
    
    useEffect(() => {
        const handleClickOutsideInlineAiChat = (event: Event) => {
            if(
                inlineAiChatRef.current && !inlineAiChatRef.current.contains(event.target as Node)
            ) {
                console.log('📴wykonano zamykanie inline ai');
                closeInlineAiBubble()
            }
        }


        if(showInlineAiBubble) {
            setTimeout(() => {
                window.addEventListener('mousedown', handleClickOutsideInlineAiChat)
            }, 0)
        }

        return () => {
            window.removeEventListener('mousedown', handleClickOutsideInlineAiChat)            
        }
    }, [showInlineAiBubble])


    const handleGenerateContent = async (isRetry = false) => {

        console.log("🖊️ GENEROWANIE KONTENTU");
        

        if(isGenerating) {
            if(abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            return
        }

        if(!isRetry) {
            lastUsedPrompt.current = userPrompt
        }

        const promptToUse = lastUsedPrompt.current
        console.log("oto prompt zapisany: ", promptToUse);
        


        if (!promptToUse.trim()) return; // Zabezpieczenie przed pustym tekstem


        // przyszłe id dla wiadomości bota
        const aiMsgId = uuidv4();


        try {
            // 1. WŁĄCZAMY MYŚLENIE OD RAZU (Zanim ruszy zapytanie sieciowe)
            setIsAiThinking(true);
            setIsGenerating(true)

            const controller = new AbortController();
            abortControllerRef.current = controller

            const aiBlockId = `ai-block-${Date.now()}`;

            
            editor.chain()
                .insertContent(
                    {
                        type: "aiBlock",
                        attrs: { 
                            id: aiBlockId,
                            content: '', 
                            status: 'streaming',
                            userSelectedContent: userSelectedContent
                    }
                })
                // .insertContent({ type: "paragraph" })
                .run()

            
            console.log("‼️", newContext.current);
            
            const fetchContext = newContext.current.trim() ? newContext.current.trim() : aiContextText
            console.log("kontekst z poziomu inline ai chatu: ", fetchContext);
            
            const response = await fetch("http://localhost:8000/api/ask-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // Przekazujemy sygnał kontrolera do żądania
                signal: controller.signal,
                body: JSON.stringify({
                    userPrompt: promptToUse,
                    contextContent: fetchContext || "no context provided",
                    type: "inlineAiGeneration"
                })
            });

            if (!response.ok) {
                throw new Error("Problem z odpowiedzią serwera");
            }

            // Wyłączamy spinner "Thinking..." w momencie, gdy przypływa pierwszy bajt danych
            setIsAiThinking(false);

            // Dodajemy pustą wiadomość od chata do tablicy, którą za chwilę zapełnimy streamem
            setChatMessages(prev => [...prev, { id: aiMsgId, content: "", role: "chat" }]);

            // Odbieramy strumień danych z body odpowiedzi
            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            if (!reader) return;

            let accumulatedText = "";

            // Pętla czytająca strumień aż do flagi done === true
            // 👇 TWÓJ POMYSŁ: Pamiętamy niezmienną pozycję startową przez całe strumieniowanie

            while (true) {
                const { value, done } = await reader.read();

                // Dekodujemy binarny chunk na stringa
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;
                }

                // Aktualizacja stanu czatu
                setChatMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMsgId ? { ...msg, content: accumulatedText } : msg
                    )
                );

                let blockPos = -1
                editor.state.doc.descendants((node, pos) => {
                    if (node.type.name === "aiBlock" && node.attrs.id === aiBlockId) {
                       blockPos = pos
                       return false; 
                    }
                })

                if (blockPos !== -1) {
                    const tr = editor.view.state.tr.setNodeMarkup(blockPos, undefined, {
                        id: aiBlockId,
                        content: accumulatedText,
                        status: done ? "completed" : "streaming",
                        userSelectedContent: userSelectedContent
                    });
                    tr.setMeta("addToHistory", false)
                    editor.view.dispatch(tr)
                    
                }

                if(done) {
                    window.dispatchEvent(new CustomEvent('update-inline-ai'))
                    break;
                };
            }
        
        } catch (error: any) {
            setIsAiThinking(false);
            if(error.name === "AbortError") {
                console.log("Strumieniowanie przerwane przez użytkownika.");
            }
            console.error("Error during generating content:", error);

        } finally {
        // 2. WYŁĄCZAMY MYŚLENIE ZAWSZE (Zarówno przy sukcesie, jak i przy błędzie sieci)
            setIsAiThinking(false)
            setIsGenerating(false)
            abortControllerRef.current = null
        }
    };


    
        useEffect(() => {
            // Dajemy Tiptapowi ułamek sekundy na zakończenie operacji na BubbleMenu...
            const timer = setTimeout(() => {
                if (inlineInputRef.current) {
                    inlineInputRef.current.focus();
                }
                }, 50); // Bezpieczne 50ms, niewidoczne dla oka ludzkiego

            return () => clearTimeout(timer);
        }, []);

    return (
        <>     
        {showInlineAiBubble && (
            <>
                {/* Okno Inputu (Chatbox) */}
                <div 
                    ref={inlineAiChatRef}
                    className="w-full max-h-[350px] z-999 max-w-[600px] h-auto transition-all duration-100 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col px-3 pt-3 pb-2">
                
                    {/* Pole tekstowe z niestandardowym scrollbarem w stylu Turbo */}
                    
                    <textarea 
                        ref={inlineInputRef}
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className=" w-[350px] min-h-[30px] max-h-[120px]   resize-none outline-none [field-sizing:content]
                        text-gray-700 bg-transparent placeholder:text-gray-400 text-[15px]"
                        placeholder="Ask any question related to project..."
                    />

                    {/* Dolny pasek narzędzi w inpucie (Ikony + Przycisk Wyślij) */}
                    <div className="flex justify-between items-center pt-3  border-t border-transparent">
                        
                        {/* Lewa strona: Mikrofon */}
                        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <Mic className="w-5 h-5" />
                        </button>
                        
                        {/* Prawa strona: Załącznik i Wyślij */}
                        <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <Paperclip className="w-[18px] h-[18px]" />
                        </button>

                        {isGenerating ? (
                            <button 
                                className="ml-1 p-[7px] bg-gray-800 text-white rounded-full transition-colors shadow-sm "
                                onClick={() => handleGenerateContent()}
                            >
                                <Spinner className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                className={`ml-1 p-[7px] text-white rounded-full transition-colors shadow-sm
                                    ${userPrompt.trim() === "" ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`}
                                onClick={() => {
                                        closeInlineAiBubble()
                                        handleGenerateContent()
                                    }
                                }                            
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        )}
                        
                        </div>
                    </div>

                </div>
            </>
        )}
              
    </>
    )
}