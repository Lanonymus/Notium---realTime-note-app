import { useRef, useState } from "react";
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

type ChatMessage = {
  id: string,
  content: string,
  role: string
}



export default function Chat({ editor }: { editor: Editor}) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [userPrompt , setUserPrompt] = useState<string>("")
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const abortControllerRef = useRef<AbortController | null>(null)



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
            role: "user"
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

            const response = await fetch("http://localhost:8000/api/ask-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // Przekazujemy sygnał kontrolera do żądania
                signal: controller.signal,
                body: JSON.stringify({
                    userPrompt: currentPrompt,
                    contextContent: editor ? editor.getText() : "no context was provided",
                    type: "test"
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
            abortControllerRef.current = null
        }
    };

    return (
        <>
        {/* Górny pasek nawigacyjny (Expand & Hide) */}
          <div className="flex justify-between items-center p-4 w-full">
            <Button variant={"outline"} className={"py-4"}>
              <Maximize2 className="w-4 h-4 stroke-gray-800" />
            </Button>            
            <Button variant={"outline"}>
              <ArrowRight className="w-4 h-4 stroke-gray-800" />
            </Button>
            {/* <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm">
              Hide <ArrowRight className="w-4 h-4" />
            </button> */}
          </div>


          {chatMessages.length > 0 ? (
            <div className="w-full h-full flex flex-col items-center max-h-full overflow-y-hidden">
              
              {/* Obszar wiadomości - przewijany, flex-1 wypycha input na sam dół */}  
                <MessageScrollerProvider autoScroll>
                    <MessageScroller className="w-full flex-1 overflow-y-auto p-4 space-y-6
                        [&::-webkit-scrollbar]:w-[5px]
                        [&::-webkit-scrollbar]:h-[5px]
                        [&::-webkit-scrollbar-track]:bg-gray-100
                        [&::-webkit-scrollbar-thumb]:bg-gray-300
                        [&::-webkit-scrollbar-thumb]:rounded-[4px]
                        ">
                        <MessageScrollerViewport>
                            <MessageScrollerContent>
                                {chatMessages.map((message) => {
                                // Sprawdzamy, kto jest autorem wiadomości
                                const isUser = message.role === "user";

                                return (
                                    <MessageScrollerItem
                                        key={message.id}
                                        messageId={message.id}
                                        scrollAnchor={isUser}
                                    >
                                        <Message align={isUser ? "end" : "start"} key={message.id}>
                                        <MessageAvatar>
                                            <Avatar>
                                            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                            <AvatarFallback>R</AvatarFallback>
                                            </Avatar>
                                        </MessageAvatar>
                                        <MessageContent>
                                            <Bubble variant="default">
                                            <BubbleContent className={`${isUser ? "bg-blue-700! text-white!" : "bg-gray-100! text-gray-700!"}`}>
                                                
                                                {isUser ? (
                                                    <span className="whitespace-pre-wrap">{message.content}</span>
                                                ) : (
                                                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100">
                                                        <ReactMarkdown remarkPlugins={[ remarkGfm ]}>
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </BubbleContent>
                                            </Bubble>
                                        </MessageContent>
                                        </Message>                                        
                                    </MessageScrollerItem>
                                );
                                })}

                                {isAiThinking && (
                                <MessageScrollerItem messageId="thinking" scrollAnchor={false}>
                                    <Marker role="status">
                                        <MarkerIcon>
                                            <Spinner />
                                        </MarkerIcon>
                                        <MarkerContent className="shimmer">Thinking...</MarkerContent>
                                    </Marker>
                                </MessageScrollerItem>
                                )}

                            </MessageScrollerContent>
                        </MessageScrollerViewport>

                        <MessageScrollerButton />
                    
                    </MessageScroller>
                </MessageScrollerProvider>


              {/* Okno Inputu (Chatbox) - zawsze na dole */}
              <div className="w-full max-w-[600px] h-fit bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col p-4 mb-[3px] shrink-0">
                
                {/* Pole tekstowe */}
                <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full min-h-[60px] max-h-[120px] resize-none outline-none [field-sizing:content] text-gray-700 bg-transparent placeholder:text-gray-400 text-[15px]"
                  placeholder="Ask any question related to project..."
                />

                {/* Dolny pasek narzędzi */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                  
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
                            onClick={() => handleGenerateContent()}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    )}

                  </div>
                </div>
              </div>
            </div>
          )
          : <>
            <div className="flex-1 flex flex-col items-center mt-10 px-6 pb-10">          
              {/* Nagłówek i opis */}
              <h1 className="text-[32px] font-bold text-gray-900 mb-3 tracking-tight">
                Hey, I'm Notium✨
              </h1>
              <p className="text-gray-500 text-[15px] mb-10 text-center">
                I can work with you on your doc and answer any questions!
              </p>


              {/* Okno Inputu (Chatbox) */}
              <div className="w-full max-h-[500px] max-w-[600px] h-auto bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col p-4">
                
                {/* Pole tekstowe z niestandardowym scrollbarem w stylu Turbo */}
                <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className=" w-full min-h-[60px] max-h-[120px]   resize-none outline-none [field-sizing:content]
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
                    <button className="ml-1 p-[7px] bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-colors shadow-sm"
                      onClick={() => handleGenerateContent()}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>}    
    </>
    )
}