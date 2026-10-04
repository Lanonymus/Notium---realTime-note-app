import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/core';




export default function ImageBubbleMenu({ editor }: { editor: Editor }) {

    // Wewnątrz komponentu z BubbleMenu:
    const activeAlignment = useEditorState({
        editor,
        selector: (ctx) => ctx.editor.getAttributes('image').alignment || 'left',
    });

    const ALIGNMENT_OPTIONS = [
    { id: 'left', label: 'Left', icon: AlignLeft },
    { id: 'center', label: 'Center', icon: AlignCenter },
    { id: 'right', label: 'Right', icon: AlignRight },
    ] as const;

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor }) => editor.isActive('image')}
            options={{ 
                offset: 9 // Lekki offset dla obu trybów
            }}
            >
            <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-sm p-1 rounded-[6px] shadow-md border border-gray-200/80">
                {ALIGNMENT_OPTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = activeAlignment === id;

                return (
                    <button
                    key={id}
                    type="button"
                    onClick={() =>
                        editor
                        .chain()
                        .focus()
                        .updateAttributes('image', { alignment: id })
                        .run()
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-[6px] rounded-[4px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                        ? 'bg-gray-100 text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    >
                    <Icon size={14} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                    <span>{label}</span>
                    </button>
                );
                })}
            </div>
        </BubbleMenu>
    );
}
