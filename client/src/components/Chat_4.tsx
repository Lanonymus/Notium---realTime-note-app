import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Maximize2, ArrowRight, FolderOpen, ArrowUp, FileType, X, Lightbulb, Brain, BookOpen, SearchCheck, Plus, Sparkles, Square, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller";
import { v4 as uuidv4 } from "uuid";
import { Spinner } from "@/components/ui/spinner";
import type { Editor } from "@tiptap/core";
import ChatHistory from "./ChatHistory";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import ChatPremadeItem from "./ChatPremadeItem";
import { Typewriter } from "./Typewriter";

const STUDY_ACTIONS = [
  { title: "Make it simple", description: "Big ideas. Everyday examples.", tag: "UNDERSTAND", icon: Lightbulb,
    color: "bg-amber-600", ink: "text-amber-600", shape: 0,
    prompt: "Explain the most complex concepts from the document in a simple and intuitive way." },
  { title: "Quiz me", description: "Find out what you already know.", tag: "PRACTICE", icon: Brain,
    color: "bg-violet-600", ink: "text-violet-600", shape: 1,
    prompt: "Create a short 5-question quiz to test knowledge based on this document." },
  { title: "Connect the ideas", description: "Your key terms, made clearer.", tag: "EXPLORE", icon: BookOpen,
    color: "bg-emerald-600", ink: "text-emerald-600", shape: 2,
    prompt: "Extract the main definitions from the text and create a concise glossary of key terms." },
  { title: "Fill the gaps", description: "See what your notes are missing.", tag: "GO DEEPER", icon: SearchCheck,
    color: "bg-blue-600", ink: "text-blue-600", shape: 3,
    prompt: "Analyze our notes and highlight any key information or important topics that are missing." },
];

const CUTOUTS = [
  "M50 4L61 11L74 9L80 21L92 27L90 41L97 52L89 64L89 78L75 82L66 94L52 90L39 96L29 85L15 82L14 68L4 58L10 44L8 30L22 23L29 10L43 12Z",
  "M26 8C38 3 42 13 50 13C59 13 64 3 78 9C91 15 91 31 84 41C103 54 91 77 79 77C78 97 57 100 48 87C31 101 10 89 15 72C-1 62 4 41 17 36C6 23 12 12 26 8Z",
  "M18 9L78 5Q91 5 93 19L96 75Q96 89 81 92L23 97Q10 97 8 81L4 27Q3 12 18 9Z",
  "M50 4Q65 5 73 19Q93 17 96 37Q98 52 85 61Q93 80 76 90Q62 99 49 86Q33 100 19 88Q7 77 15 61Q-1 49 6 32Q11 18 28 19Q34 3 50 4Z",
];

function CutoutIcon({ shape, className, children }: {
  shape: number; className?: string; children: import("react").ReactNode;
}) {
  return (
    <span className={`relative inline-flex h-[72px] w-[72px] shrink-0 items-center justify-center ${className ?? ""}`}>
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full fill-white">
        <path d={CUTOUTS[shape]} />
      </svg>
      <span className="relative [&>svg]:h-7 [&>svg]:w-7 [&>svg]:stroke-[2]">{children}</span>
    </span>
  );
}

function WelcomeDoodles() {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 90" className="pointer-events-none absolute -left-[74px] -top-2 h-[90px] w-[220px]" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 48C13 32 30 26 29 39S42 53 43 32" stroke="#059669" />
      <path d="M169 25L173 14M183 31L192 24" stroke="#d97706" />
      <path d="M190 65Q204 68 207 56" stroke="#7c3aed" />
      <path d="M54 14L58 8L62 15L55 18Z" stroke="#2563eb" />
      <circle cx="16" cy="71" r="3" fill="#e11d48" stroke="none" />
    </svg>
  );
}

type ChatMessage = {
  id: string,
  role: "user" | "chat",
  content: string,
  context: string,
  timestamp?: string
}

type Chat = {
  id: string,
  title: string,
  emoji: string,
  messages: ChatMessage[],
  createdAt: string
}

type ChatProps = {
  projectID: string | undefined,
  editor: Editor,
  context: string,
  isContentLoaded: boolean,
  onResetContext: () => void,
  onMaximizePanel: () => void,
}




export default function Chat({ projectID, editor, context, isContentLoaded, onResetContext, onMaximizePanel }: ChatProps ) {
    const promptRef = useRef<HTMLTextAreaElement>(null);
    const reduceMotion = useReducedMotion();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [allChats, setAllChats] = useState<Chat[]>([])
    const [userPrompt , setUserPrompt] = useState<string>("")
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [isChatHistoryVisible, setIsChatHistoryVisible] = useState<boolean>(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const [currentChatID, setCurrentChatID] = useState<string | null>(null);

  


    const handleGenerateContent = async () => {

        if(isGenerating) {
            if(abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            return
        }

        if (!userPrompt.trim()) return; // Zabezpieczenie przed pustym tekstem

        
        const currentPrompt = userPrompt;
        const currentContext = context !== "No context provided" ? context : editor.getText();
        setUserPrompt("");


        const userNewMessage: ChatMessage = {
            id: uuidv4(),
            role: "user",
            content: userPrompt,
            context: currentContext
        };

        // Dodajemy pustą wiadomość od chata do tablicy, którą za chwilę zapełnimy streamem
        const aiMsgID = uuidv4()
        const aiNewMessage: ChatMessage = {
            id: aiMsgID,
            role: "chat",                
            content: "",
            context: "No context provided"
        };        

    
        // lokalne wiadomości - potem po strumieniowaniu zaktualizuje ai wiadomość
        const updatedMessages = [...chatMessages, userNewMessage, aiNewMessage]
        setChatMessages(updatedMessages)

        try {
            // 1. WŁĄCZAMY MYŚLENIE OD RAZU (Zanim ruszy zapytanie sieciowe)
            setIsAiThinking(true);
            setIsGenerating(true)

            const controller = new AbortController();
            abortControllerRef.current = controller

            const fetchContext = context !== "No context provided" ? context : editor.getText()
            // console.log("kontekst wysłany w żądaniu: ", fetchContext);
            

            const response = await fetch("http://localhost:8000/api/ask-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // Przekazujemy sygnał kontrolera do żądania
                signal: controller.signal,
                body: JSON.stringify({
                    userPrompt: currentPrompt,
                    contextContent: fetchContext,
                    type: "GENERATE_TEXT"
                })
            });

            if (!response.ok) {
                throw new Error("Problem z odpowiedzią serwera");
            }

            // Wyłączamy spinner "Thinking..." w momencie, gdy przypływa pierwszy bajt danych
            setIsAiThinking(false);


            // setChatMessages(prev => [...prev, aiNewMessage]);

            // Odbieramy strumień danych z body odpowiedzi
            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            if (!reader) {
              throw new Error("AI response did not include a stream")
            }

            let accumulatedText = "";

            // Pętla czytająca strumień aż do flagi done === true
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                // Dekodujemy binarny chunk na stringa
                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // Szukamy w stanie wiadomości o id: aiMsgId i aktualizujemy jej treść
                setChatMessages(prev =>
                    prev.map(msg =>
                    msg.id === aiMsgID ? { ...msg, content: accumulatedText } : msg
                    )
            )}

            // aktualizujemy zestrumieniowany content do pustej wiadomości chatu z api
            const finalMessages = updatedMessages.map(msg => 
              msg.id === aiMsgID ? {...msg, content: accumulatedText} : msg
            )
      

            // Strzał do api i generowanie obiektu czatu i tytułu
            if(!currentChatID) {
              const titleResponse = await fetch("http://localhost:8000/api/ask-ai", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  // Przekazujemy sygnał kontrolera do żądania
                  body: JSON.stringify({
                      userPrompt: userPrompt,
                      contextContent: context,
                      projectID: projectID,
                      messages: finalMessages,
                      type: "GENERATE_TITLE"
                  })
              }); 
              
              if(!titleResponse.ok) {
                throw new Error("Problem z odpowiedzią serwera przy generowaniu historii czatu");
              }

              const data = await titleResponse.json()
              
              if( typeof data.emoji !== "string" || 
                  typeof data.title !== "string" ||
                  typeof data.id !== "string"
                ) {
                throw new Error("Malformed format of response for title from chat")
              }
              const chatTitleID = data.id;
              const chat: Chat = {
                id: chatTitleID,
                emoji: data.emoji,
                title: data.title,
                messages: finalMessages,
                createdAt: new Date().toISOString()
              }

              console.log("chat ID: ", chatTitleID);

              // data ma teraz postać: { emoji: "🌿", title: "Mit arkadyjski i jego ewolucja" }
              console.log("Wygenerowane metadane:", data.emoji, data.title);     

              setAllChats(prev => [...prev, chat])
              setCurrentChatID(chatTitleID);

          } else {

              // aktualizowanie wiadomości w instancji czatu z poziomu api
              const updateChat = await fetch("http://localhost:8000/api/updateChat", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  projectID: projectID,
                  chatID: currentChatID,
                  updatedMessages: finalMessages
                })
              })

              if(!updateChat.ok) {
                throw new Error("Aktualizacja wiadomości w chacie nie powiodła się")
              } else {
                console.log("Sukces w aktualizacji chatu");
                
              }
            // inaczej aktualizujemy wiadomości w tym chacie po prostu jeśli nie generujemy tytułu
            setAllChats(prev => 
              prev.map(chat => chat.id === currentChatID ? {...chat, messages: finalMessages} : chat)
            )
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
            onResetContext()
            abortControllerRef.current = null
            
        }
    };


    const loadNewChatMessages = (selectedChatID: string) => {
      const newChatMessges = allChats.find(chat => chat.id === selectedChatID)?.messages || [];
      setChatMessages(newChatMessges);
      console.log("Loaded new chat Messages: ", newChatMessges);
      console.log("current ID: ", selectedChatID);
    }


    // Usuwanie chatu
    const deleteChat = async (chatID: string) => {

      try {
        if(!chatID) return 

        const response = await fetch(`http://localhost:8000/api/deleteChat?chatID=${chatID}`, {
          method: "POST",
          credentials: "include"
        })
        
        if(!response.ok){
          throw new Error(`Problem z usunięciem czatu:  ${chatID}`);
        }     
        
        setAllChats(prevChats => prevChats.filter(chat => chat.id !== chatID))
        startNewChat()
        console.log("Pomyślnie usunięto chat");

        
      } catch (error) {
        console.log("problem z usunięciem chatu: ", error);
        
      }      
    }


    const startNewChat = () => {
      setChatMessages([]);
      setUserPrompt("");
      onResetContext();
      setIsChatHistoryVisible(false);
      setCurrentChatID(null); // Generujemy nowe ID dla nowego czatu
    }

    // Pobieranie chatów
    const getAllChats = async() => {
      try {
        if(!projectID) return

        const response = await fetch(`http://localhost:8000/api/getAllChats?projectID=${projectID}`, {
          method: "GET",
          credentials: "include"
        })
        
        if(!response.ok){
          throw new Error("Problem z pobraniem czatów");
        }     
        
        const result = await response.json()
        console.log("załadowane chaty: ", result);
        
        if(result && Array.isArray(result.data)) {
          setAllChats(result.data)
        }
        
      } catch (error) {
        console.log("problem z pobraniem chatów: ", error);
        
      }
    }


    // ładowanie wszystkich chatów z backendzu przy pierwszym renderze
    useEffect(() => {
      getAllChats()      
    }, [])

    
    const choosePrompt = (prompt: string) => {
      setUserPrompt(prompt);
      promptRef.current?.focus();
    };
    const hasSelection = Boolean(context.trim()) && context !== "No context provided";
    const canSend = isContentLoaded && Boolean(userPrompt.trim());


    return (
      <section className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white text-gray-800" style={{ fontFamily: "var(--font-Geist)" }} aria-label="Notium study assistant">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-gray-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-600">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Notium AI</p>
              <p className="text-[11px] text-gray-500">Your study sidekick</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button type="button" variant="outline" size="icon" title="New conversation" aria-label="New conversation" disabled={isGenerating}
              className="h-8 w-8 rounded-lg border-2 border-gray-200 bg-white shadow-none hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
              onClick={startNewChat}><Plus className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="icon" title="Conversation history" aria-label="Conversation history" aria-pressed={isChatHistoryVisible} disabled={isGenerating}
              className={`h-8 w-8 rounded-lg border-2 shadow-none ${isChatHistoryVisible ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 bg-white hover:bg-gray-50"}`}
              onClick={() => setIsChatHistoryVisible(prev => !prev)}><FolderOpen className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="icon" title="Resize chat panel" aria-label="Resize chat panel"
              className="h-8 w-8 rounded-lg border-2 border-gray-200 bg-white shadow-none hover:bg-gray-50"
              onClick={onMaximizePanel}><Maximize2 className="h-4 w-4" /></Button>
          </div>
        </header>

        {isChatHistoryVisible ? (
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <ChatHistory
              activeChatId={currentChatID}
              onSelectChat={(selectedChatID) => {
                loadNewChatMessages(selectedChatID);
                setCurrentChatID(selectedChatID);
                setIsChatHistoryVisible(false);
              }}
              onDeleteChat={(chatIdToDelete: string) => deleteChat(chatIdToDelete)}
              onNewChat={startNewChat}
              allChats={allChats}
            />
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              {chatMessages.length === 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-7">
                  <div className="mx-auto flex w-full max-w-[600px] flex-col">
                    <div className="mb-6 flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <WelcomeDoodles />
                        <span className="relative flex h-[72px] w-[72px] -rotate-6 items-center justify-center rounded-[22px] border-2 border-blue-600 bg-blue-600 text-white">
                          <svg aria-hidden="true" viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                            <path d="M15 16V21M32 16V21M15 29Q24 38 33 28" />
                            <path d="M36 8L39 5" strokeWidth="2" />
                          </svg>
                        </span>
                      </div>
                      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">A little curiosity. A big idea.</h1>
                      <p className="mt-2 max-w-[330px] text-sm leading-6 text-gray-500">Let's make your notes click. Pick a starting point or ask me anything.</p>
                    </div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-gray-500">Where shall we start?</p>
                      <span className="text-[11px] text-gray-400">Made for your notes</span>
                    </div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}>
                      {STUDY_ACTIONS.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <motion.button key={action.title} type="button" onClick={() => choosePrompt(action.prompt)}
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: reduceMotion ? 0 : index * 0.05 }}
                            whileHover={reduceMotion ? undefined : { y: -3 }}
                            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                            className={`group relative flex min-w-0 cursor-pointer flex-col items-start overflow-hidden rounded-[18px] border-2 border-black/10 p-4 text-left text-white outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 ${action.color}`}>
                            <div className="mb-3 flex w-full items-start justify-between gap-2">
                              <CutoutIcon shape={action.shape} className={action.ink}><Icon /></CutoutIcon>
                              <span className="pt-1 text-[9px] font-semibold tracking-[0.12em] text-white">{action.tag}</span>
                            </div>
                            <h2 className="text-[15px] font-semibold leading-5">{action.title}</h2>
                            <p className="mt-1 pr-5 text-xs leading-5 text-white">{action.description}</p>
                            <ArrowRight aria-hidden="true" className="absolute bottom-4 right-3 h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <MessageScrollerProvider autoScroll>
                  <MessageScroller className="h-full min-h-0 w-full flex-1">
                    <MessageScrollerViewport className="h-full w-full overflow-x-hidden px-4 py-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200">
                      <MessageScrollerContent className="mx-auto w-full max-w-[650px] space-y-6">
                        {chatMessages.map((message) => {
                          const isUser = message.role === "user";
                          if (!isUser && !message.content) return null;
                          return (
                            <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isUser} className="w-full">
                              <div className={`flex w-full min-w-0 flex-col ${isUser ? "items-end" : "items-start"}`}>
                                {isUser ? (
                                  <>
                                    {message.context && message.context !== "No context provided" && (
                                      <div className="mb-2 flex max-w-[85%] items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-500">
                                        <FileType className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                        <span className="truncate" title={message.context}>{message.context}</span>
                                      </div>
                                    )}
                                    <div className="max-w-[90%] select-text whitespace-pre-wrap break-words rounded-[16px] rounded-tr-[4px] border-2 border-blue-600 bg-blue-50 px-4 py-3 text-sm leading-6 text-gray-800">{message.content}</div>
                                  </>
                                ) : (
                                  <div className="w-full min-w-0 select-text">
                                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-800">
                                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white"><Sparkles className="h-4 w-4" /></span>
                                      Notium <span className="font-normal text-gray-400">· Study sidekick</span>
                                    </div>
                                    <div className="prose prose-sm max-w-none break-words text-gray-700 prose-p:leading-7 prose-headings:font-semibold prose-headings:text-gray-900 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-a:text-blue-600 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-gray-100 [&_table]:block [&_table]:overflow-x-auto">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </MessageScrollerItem>
                          );
                        })}
                        {isAiThinking && (
                          <MessageScrollerItem messageId="thinking" scrollAnchor={false}>
                            <div role="status" className="flex items-center gap-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
                              <Spinner className="h-4 w-4 text-blue-600 motion-reduce:animate-none" />
                              Connecting the dots in your notes…
                            </div>
                          </MessageScrollerItem>
                        )}
                      </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton className="border-2 border-gray-200 bg-white text-blue-600 shadow-none" />
                  </MessageScroller>
                </MessageScrollerProvider>
              )}
            </div>

            <footer className="shrink-0 bg-white px-4 pb-3 pt-3">
              <div className="mx-auto w-full max-w-[650px] rounded-[16px] border-2 border-gray-200 bg-white p-3 transition-colors focus-within:border-blue-600">
                {hasSelection && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs text-gray-600">
                    <FileType className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="min-w-0 flex-1 truncate" title={context}>{context}</span>
                    <button type="button" onClick={onResetContext} aria-label="Remove selected context" className="rounded p-1 text-gray-500 hover:bg-blue-100 focus-visible:outline-blue-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <textarea ref={promptRef} value={userPrompt} onChange={(event) => setUserPrompt(event.target.value)}
                  aria-label="Your question to Notium"
                  rows={2}
                  className="max-h-[140px] min-h-[56px] w-full resize-none bg-transparent px-1 text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-400 [field-sizing:content]"
                  placeholder="What would you like to understand?"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      if (canSend && !isGenerating) handleGenerateContent();
                    }
                  }}
                />
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200 pt-2.5">
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-gray-500">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className="truncate">{!isContentLoaded ? "Loading notes…" : hasSelection ? "Using selected text" : "Using your notes"}</span>
                  </span>
                  <Button type="button" disabled={!isGenerating && !canSend} onClick={() => handleGenerateContent()}
                    className={`h-9 shrink-0 gap-1.5 rounded-lg border-2 px-3 text-xs font-semibold shadow-none ${isGenerating ? "border-gray-800 bg-gray-800 text-white hover:bg-gray-700" : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100"}`}
                    aria-label={isGenerating ? "Stop generating" : "Send question"}>
                    {isGenerating ? <><Square className="h-3 w-3 fill-current" />Stop</> : <>Ask Notium<ArrowUp className="h-4 w-4" /></>}
                  </Button>
                </div>
              </div>
              <p className="mx-auto mt-2 max-w-[650px] text-center text-[10px] leading-4 text-gray-400">AI can make mistakes. Check important details in your notes.</p>
            </footer>
          </>
        )}
      </section>
    );



}
