import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import React, { useRef, useState } from "react";


type DropBoxImageProps = {
    onImageUpload: (file: File) => void,
    onCloseDropBox: () => void

}

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024 // 10 485 760 B

export default function DropBoxImage({ onImageUpload, onCloseDropBox}: DropBoxImageProps) {
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)


    const fileInputRef = useRef<HTMLInputElement>(null)

    // wywołanie otworzenia okna - browse files
    const handleBrowseClick = () => {
        fileInputRef?.current?.click()
    }
    

    // Funkcja pomocnicza - walidująca < 10 mb zdjęcia tylko
    const processFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is ${MAX_FILE_SIZE_MB}MB.`);
            setIsDragging(false)
            return;
        }

        setErrorMessage(null);
        onImageUpload(file);
        onCloseDropBox();
    }

    // obsługa wyboru pliku z systemu 
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files

        if(files && files.length > 0) {
            const file = files[0]
            if (file) {
                processFile(file)
            }
        }
    }

    // Obsługa przeciągania / hoverowania plikiem nad inputem
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    // Obsługa wyjechania poza inputa
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    // Obsługa zrzutu pliku
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const files = e.dataTransfer.files

        if(files && files.length > 0) {
            const file = files[0]
            if(file) {
                processFile(file)
            }
        }
    }


return (
        <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-200"
            onClick={onCloseDropBox}
        >
            <div 
                className="relative flex flex-col w-full max-w-[420px] p-6 bg-white rounded-[12px] border border-gray-100 shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={onCloseDropBox}
                    className="absolute top-[1px] right-[1px] p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                    <X size={18} />
                </button>

                <div 
                    onClick={handleBrowseClick}            
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[8px] py-10 px-4 flex flex-col justify-center items-center gap-3 transition-all cursor-pointer group ${
                        isDragging 
                            ? "border-gray-900 bg-gray-100/80 scale-[1.01]" 
                            : errorMessage 
                                ? "border-red-300 bg-red-50/30" 
                                : "border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50"
                    }`}
                >
                    <div className={`p-2.5 rounded-full bg-white border border-gray-100 shadow-xs transition-transform 
                        ${isDragging ? "scale-110" : "group-hover:scale-105"}`}>
                        <Upload className={`w-5 h-5 transition-colors ${isDragging ? "text-gray-900" : "text-gray-700"}`} />
                    </div>

                    <span className={`text-sm font-semibold transition-colors ${isDragging ? "text-gray-900" : "text-gray-800"}`}>
                        {isDragging ? "Drop the image" : "Drop file here"}
                    </span>
                </div>

                <div className="flex items-center gap-3 my-5">
                    <div className="h-[1px] bg-gray-200/80 flex-1" />
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
                    <div className="h-[1px] bg-gray-200/80 flex-1" />
                </div>

                <Button 
                    type="button"
                    onClick={handleBrowseClick}
                    className="w-full h-11 bg-gray-900 hover:bg-black text-white font-medium rounded-[8px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    Browse file
                </Button>

                {/* Wyświetlanie błędu w przypadku zbyt dużego pliku */}
                {errorMessage && (
                    <p className="mt-3 text-xs font-medium text-red-500 text-center animate-in fade-in">
                        {errorMessage}
                    </p>
                )}

                <div className="mt-5 flex flex-col items-center justify-center gap-0.5 text-center">
                    <p className="text-xs font-medium text-gray-600">
                        Only PNG, JPG, WEBP files are supported
                    </p>
                    <p className="text-[11px] text-gray-400">
                        Max file size: {MAX_FILE_SIZE_MB}MB 
                    </p>
                </div>
            </div>
        </div>
    )
}