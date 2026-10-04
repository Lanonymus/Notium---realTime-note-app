import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Check, Copy, Download,Loader2, Maximize2, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getMediaUrl } from './GetMediaUrl';


const ALIGNMENT_CLASSES = {
    left: '!float-left !mr-4 !mb-2 !clear-none',
    center: '!flex !justify-center !w-full !my-4 clear-both',
    right: '!float-right !ml-4 1mb-2 !clear-none'
}


export const ImageNodeView: React.FC<NodeViewProps> = ({ node, editor, getPos, deleteNode, selected, updateAttributes }) => {
    const { src, alt, isUploading, progress, alignment = 'left' } = node.attrs
    const [copied, setCopied] = useState<boolean>(false)
    const imageRef = useRef<HTMLImageElement>(null)
    const isDirectlySelected = selected || (
        typeof getPos === "function" && editor.state.selection.from === getPos()
    )

    // const imageUrl = 
    const circumference = 163.36 // 2 * π * 26px (radius)


    // Obsługa kopiowania adresu url obrazka
    const handleCopy = () => {
        navigator.clipboard.writeText(src)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Obsługa pobierania obrazka
    const handleDownload = async () => {
        const docId = node.attrs.docId
        const fileName = node.attrs.fileName

        try {
            const mediaUrl = getMediaUrl(docId, fileName)

            const response = await fetch(mediaUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob) // tworzy unikalny adres tymczasowy - blob:http://localhost:3000/1234-abcd
            const link = document.createElement('a')
            link.href = url
            link.download = alt || 'image'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Błąd podczas pobierania: ", error);
        }
    }

    const handleExpand = () => {
        window.open(src, '_blank')
    }

    // LOGIKA ZMIANY ROZMIARU
    const handleResizeStart = (e: React.MouseEvent, direction: 'left' | 'right') => {
        e.preventDefault()
        e.stopPropagation()

        const startX = e.clientX
        const startWidth = imageRef.current?.getBoundingClientRect().width || 0

        const onMouseMove = (moveEvent: MouseEvent) => {
            
            requestAnimationFrame(() => {
                const currentX = moveEvent.clientX
                
                // jeśli ciągniemy w prawo, delta na plus inaczej na minus
                const deltaX = direction === 'right' ? currentX - startX : startX - currentX
                const newWidth = Math.max(150, startWidth + deltaX)
                
                if(imageRef.current) {
                    imageRef.current.style.width = `${newWidth}px`
                }
            })
        }

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)

            // Zapisujemy nowy wymiar do bazy Tiptapa - niskopoziomowo ProseMirror
            if (imageRef.current) {
                updateAttributes({ width: imageRef.current.style.width })

                // wymuszamy aktualizację rozmiaru żeby websocket nie uznał jej za zbedną 
                // tworzymy pusta transakcję z metadanymi
                // editor.chain().focus().command(({ tr }) => {
                //     tr.setMeta('forceSync', true)
                //     tr.setMeta('addToHistory', false) // zmiana stanu nie blokuje ctrl + z
                //     return true
                // }).run()
            }
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }
    return (
    <>

        <NodeViewWrapper 
            as="div"
            className={`relative group select-none align-bottom leading-[0] transition-all
                ${ALIGNMENT_CLASSES[alignment as keyof typeof ALIGNMENT_CLASSES] || ALIGNMENT_CLASSES.left
            }`}
        >

            <div className={`relative transition-all duration-150 !inline-block !w-fit !h-fit
                    ${isDirectlySelected ? 'ring-3 ring-blue-500 z-3' : ''}`}>

                <img 
                    style={{ width: node.attrs.width || "150px"}}
                    ref={imageRef}
                    src={src} 
                    alt={alt || ""} 
                    className={`block h-auto max-w-full rounded-[3px] border-none !m-0 !p-0 
                        ${isUploading ? 'scale-[1.01]' : ''}`}
                />

                {isUploading && (
                    <div className="absolute inset-0 m-0 p-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                        <div className="relative flex items-center justify-center">
                            <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="text-white/20"
                                    fill="transparent"
                            />

                            <circle
                                cx="32"
                                cy="32"
                                r="26"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-white transition-all duration-150 stroke-round"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - (circumference * (progress || 0)) / 100}
                            />
                            </svg>

                            <Loader2 className="absolute w-6 h-6 text-white animate-spin" />
                        </div>

                        <span className="mt-2 text-xs font-semibold tracking-wider text-white/90">
                            {progress ? `${Math.round(progress)}%` : 'Loading...'}
                        </span>
                    </div>
                )}      

                {/* Pływające menu akcji w prawym górnym rogu */}
                {!isUploading && (
                    <div className={`absolute top-3 right-3 z-20 flex items-center gap-0.5 bg-white/95
                        backdrop-blur-xs p-1 rounded-lg border border-gray-200/80 shadow-md text-gray-600
                        transition-all duration-200 ${selected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
                    }`}>
                        <button
                            type="button"
                            onClick={handleCopy}
                            title="Kopiuj URL"
                            className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            {copied ? <Check size={16} className="text-emerald-600" />  : <Copy size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            title="Pobierz"
                            className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleExpand}
                            title="Powiększ"
                            className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            <Maximize2 size={16} />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />
                        <button
                            type="button"
                            onClick={deleteNode}
                            title="Usuń"
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}     

                {/* Niebieskie uchwyty - 8 punktów zaznaczenia */}
                {isDirectlySelected && !isUploading && (
                    <>
                        {/* Rogi */}

                        {/* Lewa strona (zmniejszanie/zwiększanie od lewej) */}
                        <div onMouseDown={(e) => handleResizeStart(e, 'left')} className="absolute -top-2 -left-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-nwse-resize"/>
                        <div onMouseDown={(e) => handleResizeStart(e, 'left')} className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-nesw-resize"/>
                        <div onMouseDown={(e) => handleResizeStart(e, 'left')} className="absolute top-1/2 -left-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-ew-resize"/>
                        
                        {/* Prawa strona (zmniejszanie/zwiększanie od prawej) */}
                        <div onMouseDown={(e) => handleResizeStart(e, 'right')} className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-nesw-resize"/>
                        <div onMouseDown={(e) => handleResizeStart(e, 'right')} className="absolute -bottom-2 -right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-nwse-resize"/>
                        <div onMouseDown={(e) => handleResizeStart(e, 'right')} className="absolute top-1/2 -right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-ew-resize"/>

                        {/* Góra / Dół - służą u Ciebie za estetykę (szerokość proporcjonalna sterowana prawym/lewym bokiem) */}
                        <div className="absolute -top-2 left-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-ns-resize"/>
                        <div className="absolute -bottom-2 left-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs z-10 cursor-ns-resize"/>

                    </>
                )}     
            </div>
        </NodeViewWrapper>
    </>
    )
}