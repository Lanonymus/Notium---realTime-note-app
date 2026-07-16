import React from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { DOMParser } from 'prosemirror-model';
import { Button } from '@/components/ui/button'
import { Check, Trash, Sparkles, RotateCcw } from "lucide-react"

export const AiBlockView: React.FC<NodeViewProps> = ({ node, editor, getPos, deleteNode}) => {
  const { content, status } = node.attrs;

  // 👇 AKCJA: POTWIERDŹ (Przeformatowanie do czystego ProseMirror)
  const handleAccept = () => {
    // 1. Pobieramy pozycję tego bloku w edytorze
    if(typeof getPos !== 'function') return
    const from = getPos();
    if(from === undefined || typeof from !== "number") {
        console.log("coś nie działa w aiBlockView, funkcja getPos");
        return
    }
    const to = from + node.nodeSize;

    // 2. Parsujemy surowy HTML (który teraz jest już kompletny) na węzły ProseMirror
    const parser = DOMParser.fromSchema(editor.schema);
    const dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = content;
    const slice = parser.parseSlice(dummyDiv);

    // 3. Robimy jedną czystą transakcję: usuwamy blok AI i wstawiamy wyrenderowaną treść
    const tr = editor.view.state.tr.replaceWith(from, to, slice.content);
    editor.view.dispatch(tr);

    // Ustawiamy kursor użytkownika pod wygenerowaną treścią
    const newEndPos = from + slice.content.size

    editor.chain()
        .setTextSelection(newEndPos)
        .insertContent('<p></p>')
        .focus()
        .run()

    // 2. Sprzątamy UI
    window.dispatchEvent(new CustomEvent('close-ai-menu'));
  };

  const handleReject = () => {
      if (typeof getPos !== 'function') return;
      const from = getPos();
      if(from === undefined || typeof from !== "number") {
        console.log("coś nie działa w aiBlockView, funkcja getPos");
        return
      }

      const to = from + node.nodeSize;
      const userSelectedContent = node.attrs.userSelectedContent; // Pobieramy snapshot

      console.log("from: ", from, '\n', "to: ", to, "\n", "userSelectedContent: ", userSelectedContent);

      
      // 1. Zamieniamy blok AI na oryginalny tekst
      setTimeout(() => {
        const chain = editor.chain().focus()
        if(userSelectedContent?.content) {
          chain.insertContentAt({ from, to }, userSelectedContent.content) // Wstawiamy tekst w miejsce bloku
        } else {
          chain.deleteRange({ from, to})
        }
        chain.run()
      }, 0)

      // 2. Sprzątamy UI
      window.dispatchEvent(new CustomEvent('close-ai-menu'));
  };

  const handleRetry = () => {
      console.log("ponowienie generacji z handleRetry");
    
      deleteNode()
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('retry-ai-generation', { detail: { newContext: content }}));
      }, 0)
  };

const handleModify = () => {
    console.log("✌️kontekst z poziomu handleModify i próba odpalenia: ");
    const aiBlockId = node.attrs.id;

    // 1. Zaznaczamy ten blok sztucznie w Tiptap. 
    // Dzięki temu warunek (!editor.state.selection.empty) w BubbleMenu zostaje spełniony.
    // Zakładam, że masz dostęp do getPos() z NodeView Tiptapa.
    if (typeof getPos !== 'function') {
      return
    }

    const position = getPos();
    if (typeof position !== 'number') {
      return
    }

    editor.commands.setNodeSelection(position);
    
    // 2. Dajemy Reactowi czas na wyrenderowanie InlineAiChat i odpalenie useEffect.
    // Czas 0ms tu nie wystarczy, bo React musi przemielić montowanie DOM. 50ms to bezpieczny margines.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-inline-ai-chat', { 
        detail: { newContext: content, aiBlockId: aiBlockId }
      }));
    }, 0); 
  }

  return (
    <NodeViewWrapper className="my-4 p-4 border-2 border-blue-400 bg-purple-50/30 rounded-xl shadow-sm backdrop-blur-sm transition-all">
      {/* Pasek statusu AI */}
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-blue-700">
        <div className="flex items-center gap-2">
          {status === 'streaming' && <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />}
          <span>{status === 'streaming' ? 'AI generuje treść...' : 'AI zakończyło pracę'}</span>
        </div>
      </div>

      {/* Kontener na streamowany tekst / tabele */}
      {/* Używamy dangerouslySetInnerHTML, bo wewnątrz Reacta nie psuje to struktury edytora głównego */}
      <div 
        className="prose prose-purple max-w-none text-gray-800 min-h-[40px]"
        dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">Oczekiwanie na dane...</p>' }}
      />

      {/* 👇 PANEL STEROWANIA (Pokazuje się tylko po zakończeniu streamu) */}
      {status === 'completed' && (
        <div className="flex justify-between items-center gap-2 mt-4 pt-3 border-t border-purple-200 animate-fadeIn">
          <div className='flex gap-2'>
            <Button
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check/>
              Accept
            </Button>
            <Button
              variant={"outline"}
              onClick={handleRetry}
              className="border-gray-300"
            >
              <RotateCcw/>
              Try again
            </Button>
            <Button
              variant={"destructive"}
              onClick={handleReject}
            >
              <Trash/>
              reject
            </Button>
          </div>
          <Button
            variant={"secondary"}
            onClick={handleModify}
          >
            <Sparkles/>
            Modify
          </Button>
        </div>
      )}
    </NodeViewWrapper>
  );
};