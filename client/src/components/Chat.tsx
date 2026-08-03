import { useRef, useState } from "react";
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
  content: string,
  role: string,
  context: string
}

type ChatProps = {
  editor: Editor,
  context: string,
  isContentLoaded: boolean,
  onResetContext: () => void,
  onMaximizePanel: () => void,
}

type ChatMetaData = {
  id: string,
  emoji: string,
  title: string
}


export default function Chat({ editor, context, isContentLoaded, onResetContext, onMaximizePanel }: ChatProps ) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [userPrompt , setUserPrompt] = useState<string>("")
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [isChatHistoryVisible, setIsChatHistoryVisible] = useState<boolean>(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const isFirstMessage = chatMessages.length === 0;
    const [chatHistory, setChatHistory] = useState<ChatMetaData[]>([]); // Stan dla historii czatów


    const handleGenerateChatHistory = async (userPrompt: string, context: string) => {
      try {

          const response = await fetch("http://localhost:8000/api/ask-ai", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              // Przekazujemy sygnał kontrolera do żądania
              body: JSON.stringify({
                  userPrompt: userPrompt,
                  contextContent: context,
                  type: "GENERATE_TITLE"
              })
          }); 
          
          if(!response.ok) {
            throw new Error("Problem z odpowiedzią serwera przy generowaniu historii czatu");
          }

          const data = await response.json()
          
          if(typeof data.emoji !== "string" || typeof data.title !== "string") {
            throw new Error("Malformed format of response for title from chat")
          }
          const chatTitleID = uuidv4();
          const chatTitle: ChatMetaData = {
            id: chatTitleID,
            emoji: data.emoji,
            title: data.title
          }

          // data ma teraz postać: { emoji: "🌿", title: "Mit arkadyjski i jego ewolucja" }
          console.log("Wygenerowane metadane:", data.emoji, data.title);     
          setChatHistory(prev => [...prev, chatTitle])     
          

          
      } catch (error) {
        console.log("Error generating chat history:", error);
      }
    }
    



    const handleGenerateContent = async () => {

        if(isGenerating) {
            if(abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            return
        }

        if (!userPrompt.trim()) return; // Zabezpieczenie przed pustym tekstem

        const msgId = uuidv4();
        const userNewMessage = {
            id: msgId,
            content: userPrompt,
            role: "user",
            context: context !== "No context provided" ? context : "No context provided"
        };

        setChatMessages(prev => [...prev, userNewMessage]);
        const currentPrompt = userPrompt;
        setUserPrompt("");

        // przyszłe id dla wiadomości bota
        const aiMsgId = uuidv4();



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

            // Dodajemy pustą wiadomość od chata do tablicy, którą za chwilę zapełnimy streamem
            setChatMessages(prev => [...prev, { id: aiMsgId, content: "", role: "chat", context: "No context provided"}]);

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
                    msg.id === aiMsgId ? { ...msg, content: accumulatedText } : msg
                    )
            )}
        
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
            
            const fetchContext = context !== "No context provided" ? context : editor.getText()
            if(isFirstMessage) {
              handleGenerateChatHistory(userPrompt, fetchContext)
            }
        }
    };


    const startNewChat = () => {
      setChatMessages([]);
      setUserPrompt("");
      setIsAiThinking(false);
      setIsGenerating(false);
      onResetContext();
      setIsChatHistoryVisible(false);
    }

    return (
        <>
          {/* Górny pasek nawigacyjny (Expand & Hide) */}
          <Button variant={"outline"} className={"py-4 absolute top-4 left-4 z-999"} onClick={onMaximizePanel}>
            <Maximize2 className="w-4 h-4 stroke-gray-800" />
          </Button>  

          <Button variant={"outline"} className={"py-4 absolute top-4 left-16 z-999"} 
            onClick={() => setIsChatHistoryVisible(prev => !prev)}>
            <FolderOpen  className="w-4 h-4 stroke-gray-800" />
          </Button>            

        

          {isChatHistoryVisible ? (
            <ChatHistory onNewChat={() => startNewChat()} chatHistory={chatHistory} />
          ) : chatMessages.length > 0 ? (
          <div className="w-full h-full flex flex-col  items-center mt-15 max-h-full overflow-y-hidden bg-slate-50/50" style={{ fontFamily: 'var(--font-Geist)' }}>
            
            {/* Obszar wiadomości - przewijany */}  
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="w-full h-full min-w-[150px] justify-center items-center">
                  <MessageScrollerViewport className="w-full h-full  flex px-6 pt-8 space-y-8 
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
          <div className="flex-1 flex flex-col justify-around mt-5 px-6">   

            <div className="w-full flex flex-col justify-center items-center ">
              {/* Nagłówek i opis */}
              <h1 className="text-[32px] font-bold text-gray-900 mb-3 tracking-tight">
                <Typewriter text={"Hey, I'm Notium✨"} speed={50} delay={0} />
              </h1>
              <p className="text-gray-500 text-[15px] mb-8 text-center">
                <Typewriter text={"I can work with you on your doc and answer any questions!"} speed={30} delay={1000}/>
              </p>

              {/* Sugerowane dymki (2x2 Grid) */}
              <div className="w-full max-w-[600px] grid grid-cols-2 gap-3 mb-4">
                

                {/* Bubble 1: Feynman Technique */}
                <ChatPremadeItem
                  icon={<Lightbulb className="w-4 h-4" />}
                  title="Simplify concepts"
                  description="Use simple language and analogies"
                  onClick={() => setUserPrompt("Explain the most complex concepts from the document in a simple and intuitive way.")}
                  delay={100}
                />

                {/* Bubble 2: Active Recall / Quiz */}
                <ChatPremadeItem
                  icon={<Brain className="w-4 h-4" />}
                  title="Generate a quiz"
                  description="Test your knowledge with questions"
                  onClick={() => setUserPrompt("Create a short 5-question quiz to test knowledge based on this document.")}
                  delay={200}
                />

                {/* Bubble 3: Key Concepts / Glossary */}
                <ChatPremadeItem
                  icon={<BookOpen className="w-4 h-4" />}
                  title="Key concepts"
                  description="Build a clear glossary"
                  onClick={() => setUserPrompt("Extract the main definitions from the text and create a concise glossary of key terms.")}
                  delay={300}
                />

                {/* Bubble 4: Knowledge Gap Detection */}
                <ChatPremadeItem
                  icon={<SearchCheck className="w-4 h-4" />}
                  title="Find knowledge gaps"
                  description="Check what's missing in your notes"
                  onClick={() => setUserPrompt("Analyze our notes and highlight any key information or important topics that are missing.")}
                  delay={400}
                />

              </div>
            </div>       
            

            {/* Okno Inputu (Chatbox) */}
            <div className="w-full max-h-[500px] mr-auto ml-auto max-w-[600px] h-auto bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col p-4">
              
              {context !== "No context provided" && (
                <Item variant={"outline"} className="mb-2">
                  <ItemMedia variant="icon">
                    <FileType />
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
                text-gray-700 bg-transparent placeholder:text-gray-400 text-[15px]
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
              <div className="flex justify-between items-center pt-3 border-t border-transparent">
                
                {/* Lewa strona: Mikrofon */}
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                  <Mic className="w-5 h-5" />
                </button>
                
                {/* Prawa strona: Załącznik i Wyślij */}
                <div className="flex items-center gap-1">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                    <Paperclip className="w-[18px] h-[18px]" />
                  </button>
                  <button 
                    className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer         
                      ${!isContentLoaded || userPrompt.trim() === "" 
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed! shadow-none" 
                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/10 hover:shadow-lg"}`}
                    onClick={() => handleGenerateContent()}
                    disabled={!isContentLoaded || userPrompt.trim() === ""}
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

            </div>
          </div> )}    
          
          
    </>
    )
}