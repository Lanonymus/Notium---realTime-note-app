import { useEffect, useRef, useState } from "react";
import { Maximize2, ArrowRight, FolderOpen, Mic, Paperclip, ArrowUp, FileType, X, Lightbulb, Brain, BookOpen, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Chat ai i wiadomości
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { v4 as uuidv4 } from "uuid"
import { Spinner } from "@/components/ui/spinner";
import { Editor } from "@tiptap/core"
import { Typewriter } from "./Typewriter";
import ChatPremadeItem from "./ChatPremadeItem";
import ChatHistory from "./ChatHistory";

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



    return (
        <>
          {/* Górny pasek nawigacyjny (Expand & Hide) */}
          <Button variant={"outline"} className={"py-4 absolute top-4 left-4 z-10"} onClick={onMaximizePanel}>
            <Maximize2 className="w-4 h-4 stroke-gray-800" />
          </Button>  

          <Button variant={"outline"} className={"py-4 absolute top-4 left-16 z-10"} 
            onClick={() => setIsChatHistoryVisible(prev => !prev)}>
            <FolderOpen  className="w-4 h-4 stroke-gray-800" />
          </Button>            

        

          {isChatHistoryVisible ? (
            <ChatHistory 
              activeChatId={currentChatID} 
              onSelectChat={(selectedChatID) => {
                loadNewChatMessages(selectedChatID)
                setCurrentChatID(selectedChatID)

                setTimeout(() => {
                  setIsChatHistoryVisible(false)
                }, 0);
              }} 
              onDeleteChat={(chatIdToDelete: string) => deleteChat(chatIdToDelete)}
              onNewChat={() => startNewChat()} 
              allChats={allChats} 
            />
          ) : chatMessages.length > 0 ? (
          <div className="w-full h-full flex flex-col  items-center mt-15 max-h-full overflow-y-hidden bg-slate-50/50" style={{ fontFamily: 'var(--font-Geist)' }}>
            
            {/* Obszar wiadomości - przewijany */}  
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="w-full h-full justify-center min-w-[150px]">
                  <MessageScrollerViewport className="w-full h-full justify-center  flex px-6 pt-8 space-y-8 
                    [&::-webkit-scrollbar]:w-[4px] 
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-gray-200
                    [&::-webkit-scrollbar-thumb]:rounded-full
                  ">
                      <MessageScrollerContent className="max-w-[650px] w-full">
                          {chatMessages.map((message) => {
                            const isUser = message.role === "user";

                            return (
                                <MessageScrollerItem
                                    key={message.id}
                                    messageId={message.id}
                                    scrollAnchor={isUser}
                                    className="w-full"
                                >
                                    {/* Pełna szerokość dla każdego wiersza, brak domyślnych komponentów Message/Avatar dla bota */}
                                    <div className={`flex flex-col w-full ${isUser ? "items-end" : "items-start"}`}>
                                    
                                        {isUser ? (
                                          <>
                                            {/* Subtelny Context użytkownika - lżejszy i dopasowany do prawej strony */}
                                            {message.context !== "No context provided" && (
                                              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-150 rounded-lg text-xs text-gray-500 mb-2 shadow-sm max-w-[85%]">
                                                <FileType className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                <span className="truncate font-medium">{message.context}</span>
                                              </div>
                                            )}
                                            
                                            {/* Bąbelek użytkownika - Clean z Twoim niebieskim akcentem */}
                                            <div className="bg-blue-600 text-white py-2.5 px-4 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] text-[15px] leading-relaxed select-text">
                                              <span className="whitespace-pre-wrap font-[var(--font-Geist)]!">{message.content}</span>   
                                            </div>                                               
                                          </>
                                        ) : (
                                          /* Wypowiedź AI w stylu Turbo AI: brak szarego tła, czysty dokument na białym tle */
                                          <div className="w-full space-y-2 animate-fade-in select-text">
                                            {/* Subtelny Badge AI z niebieskim akcentem na start tekstu */}
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full w-fit">
                                              <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                              Notium AI
                                            </div>

                                            {/* Treść Markdown - czysty prose bez sztucznych ramek */}
                                            <div className="prose prose-base max-w-none text-gray-800 
                                              prose-p:leading-relaxed prose-p:text-gray-700
                                              prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                                              prose-ul:list-disc prose-ul:pl-5 prose-li:my-1
                                              prose-strong:text-gray-950 prose-strong:font-semibold
                                              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl">
                                                <ReactMarkdown remarkPlugins={[ remarkGfm ]}>
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>
                                            
                                            {/* Delikatna linia separująca lub pusta przestrzeń pod wypowiedzią */}
                                            <div className="pt-4 border-b border-gray-100/80 w-full" />
                                          </div>
                                        )}
                                    </div>                                       
                                </MessageScrollerItem>
                            );
                          })}

                          {/* Sekcja Thinking w stylu Modern Minimal */}
                          {isAiThinking && (
                            <MessageScrollerItem messageId="thinking" scrollAnchor={false}>
                                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium py-2">
                                    <Spinner className="w-4 h-4 text-blue-500 animate-spin" />
                                    <span className="tracking-wide text-xs uppercase font-semibold text-gray-400">Notium is thinking...</span>
                                </div>
                            </MessageScrollerItem>
                          )}

                      </MessageScrollerContent>
                  </MessageScrollerViewport>

                  <MessageScrollerButton className="ml-8 border border-gray-200 shadow-sm text-gray-500 hover:text-blue-500 hover:bg-white transition-all"/>
              </MessageScroller>
            </MessageScrollerProvider>


            {/* Okno Inputu (Chatbox) w stylu Turbo - Lekkie, unoszące się nad tłem */}
            <div className="w-full  max-w-[650px] bg-white border border-gray-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col p-3.5  shrink-0 transition-all focus-within:border-blue-400 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
              
              {context !== "No context provided" && (
                <div className="mb-2 flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-600 animate-fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <FileType className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium truncate">{context}</span>
                  </div>
                  <button 
                    onClick={onResetContext} 
                    className="text-[11px] font-semibold text-gray-400 hover:text-white  ml-1 px-2 py-1 rounded-md hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Pole tekstowe */}
              <textarea 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full min-h-[44px] max-h-[140px] px-1 resize-none outline-none [field-sizing:content] text-gray-850 bg-transparent placeholder:text-gray-400/90 text-[15px] leading-relaxed"
                placeholder="Ask any question related to project..."
                onKeyDown={(e) => {
                  if(e.key === "Enter" && !e.shiftKey){
                    e.preventDefault();
                    handleGenerateContent()
                  }
                }}                
              />

              {/* Dolny pasek narzędzi - Ikony i Przycisk w jednym rzędzie z Border-T */}
              <div className="flex justify-between items-center pt-2.5 border-t border-gray-50 mt-2">
                <div className="flex items-center gap-0.5">
                  <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                    <Mic className="w-[18px] h-[18px]" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                    <Paperclip className="w-[17px] h-[17px]" />
                  </button>
                </div>
                
                <div>
                  {isGenerating ? (
                      <button 
                          className="p-2 bg-gray-900 text-white rounded-xl transition-all shadow-sm hover:bg-gray-800 cursor-pointer"
                          onClick={() => handleGenerateContent()}
                      >
                          <Spinner className="w-4 h-4 text-white" />
                      </button>
                  ) : (
                      <button 
                          className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer                           
                              ${userPrompt.trim() === "" 
                                ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none" 
                                : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/10 hover:shadow-lg"}`}
                          onClick={() => handleGenerateContent()}
                          disabled={userPrompt.trim() === ""}
                      >
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>
                  )}
                </div>
              </div>
            </div>
          </div>




          // <--------CHAT POCZĄTKOWY - DOMYŚLNY EKRAN DLA STARTU APPLIKACJI-------->
          )
          : (
          
          <div className="flex-1 flex flex-col justify-around my-3 px-6 bg-gradient-to-b from-slate-50/60 via-blue-50/25 to-slate-50/60 rounded-2xl">   

            <div className="w-full flex flex-col justify-center items-center">
              

              {/* Nagłówek i opis */}
              <h1 className="text-[32px] font-bold text-gray-900 mb-2 tracking-tight">
                <Typewriter text={"Hey, I'm Notium✨"} speed={50} delay={0} />
              </h1>
              <p className="text-gray-500 text-[14px] mb-10 text-center max-w-[420px] leading-relaxed">
                <Typewriter text={"I can work with you on your doc and answer any questions!"} speed={30} delay={1000}/>
              </p>


              <div className="mb-4 grid w-full max-w-[600px] grid-cols-2 gap-3">
                {[
                  {
                    title: "Simplify concepts",
                    description: "Use simple language and analogies",
                    image: "/notesImages/lightBulb.png", // np. "/images/simplify.png"
                    prompt:
                      "Explain the most complex concepts from the document in a simple and intuitive way.",
                    className: "h-[100px]"
                  },
                  {
                    title: "Generate a quiz",
                    description: "Test your knowledge with questions",
                    image: "/notesImages/pencil.png", // np. "/images/quiz.png"
                    prompt:
                      "Create a short 5-question quiz to test knowledge based on this document.",
                    className: "h-[100px] rotate-[-30deg] -translate-y-[8px]"
                  },
                  {
                    title: "Key concepts",
                    description: "Build a clear glossary",
                    image: "/notesImages/key.png", // np. "/images/concepts.png"
                    prompt:
                      "Extract the main definitions from the text and create a concise glossary of key terms.",
                    className: "!h-[100px] -translate-y-[5px] rotate-[-10deg]"
                  },
                  {
                    title: "Find knowledge gaps",
                    description: "Check what's missing in your notes",
                    image: "/notesImages/magnifier.png", // np. "/images/gaps.png"
                    prompt:
                      "Analyze our notes and highlight any key information or important topics that are missing.",
                    className: "h-[100px]"
                  },
                ].map((item) => {
                  const isSelected = userPrompt === item.prompt;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setUserPrompt(item.prompt)}
                      aria-pressed={isSelected}
                      className={`
                        group relative flex min-w-0 flex-col
                        lg:flex-row lg:items-center
                        gap-2 rounded-[12px] border-2 p-4
                        text-left outline-none cursor-pointer
                        focus-visible:ring-2 focus-visible:ring-blue-600
                        focus-visible:ring-offset-2 active:translate-y-[3px] active:shadow-none
                        ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 shadow-[1px_2px_0px_#e5e7eb] bg-white "
                        }
                      `}
                    >
                      {/* Tekst — może się zawijać */}
                      <div className="min-w-0 w-full lg:w-auto lg:flex-1">
                        <h3 className="text-sm font-medium leading-5 text-gray-800">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs leading-4 text-gray-500">
                          {item.description}
                        </p>
                      </div>

                      {/* Stałe miejsce na ilustrację — nie kurczy się */}
                      <div
                        className="
                          flex h-[96px] w-[96px] shrink-0
                          items-center justify-center self-end
                          lg:self-center
                        "
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            draggable={false}
                            className={`
                              block w-auto max-w-full shrink-0 object-contain
                              transition-transform duration-300
                              motion-safe:group-hover:-translate-y-1
                              ${item.className}
                            `}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>


            </div>       

            {/* Okno Inputu (Chatbox) - Dopracowane ramki i cienie */}
            <div className="w-full max-h-[500px] mr-auto ml-auto max-w-[600px] h-auto bg-white/90 backdrop-blur-sm
             border-gray-200/90 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col p-4 transition-all
              focus-within:border-blue-500 border-[2px] focus-within:shadow-[0_4px_25px_rgba(59,130,246,0.08)]">
              
              {context !== "No context provided" && (
                <Item variant={"outline"} className="mb-2 bg-slate-50/80 border-slate-200/60">
                  <ItemMedia variant="icon">
                    <FileType className="text-blue-500" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Context</ItemTitle>
                    <ItemDescription>{context}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant={"default"} className={"text-[13px] cursor-pointer"} onClick={onResetContext}>Delete</Button>
                  </ItemActions>
                </Item>
              )}

              {/* Pole tekstowe */}
              <textarea 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full min-h-[60px] max-h-[120px] resize-none outline-none [field-sizing:content]
                text-gray-800 bg-transparent placeholder:text-gray-400 text-[15px] leading-relaxed
                  [&::-webkit-scrollbar]:w-[5px]
                  [&::-webkit-scrollbar]:h-[5px]
                  [&::-webkit-scrollbar-track]:bg-gray-100
                  [&::-webkit-scrollbar-thumb]:bg-gray-300
                  [&::-webkit-scrollbar-thumb]:rounded-[4px]                
                "
                placeholder="Ask any question related to project..."
                onKeyDown={(e) => {
                  if(e.key === "Enter" && !e.shiftKey){
                    e.preventDefault();
                    handleGenerateContent();
                  }
                }}
              />

              {/* Dolny pasek narzędzi w inpucie */}
              <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 mt-1">
                
                {/* Lewa strona: Mikrofon */}
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all cursor-pointer">
                  <Mic className="w-4 h-4" />
                </button>
                
                {/* Prawa strona: Załącznik i Wyślij */}
                <div className="flex items-center gap-1.5">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all cursor-pointer">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button 
                    className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer         
                      ${!isContentLoaded || userPrompt.trim() === "" 
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none" 
                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/15 hover:shadow-md"}`}
                    onClick={() => handleGenerateContent()}
                    disabled={!isContentLoaded || userPrompt.trim() === ""}
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

            </div>
          </div>            

          
          )}    
          
          
    </>
    )
}