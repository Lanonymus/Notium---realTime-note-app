import { HugeiconsIcon } from '@hugeicons/react';
import { File01Icon  } from '@hugeicons/core-free-icons';
import { Cancel01Icon  } from '@hugeicons/core-free-icons';

export default function InputFile({ file, removeFile }) {

    // Link do źródła pliku
    const src = file.dataUrl;

    // console.log(file.type);
    
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    // console.log('typ pliku: ', file.type);
    



    const bytesToMB = (size) => {
        return `${(size / 1_000_000).toFixed(1)} MB`
    }

    return (

        <div className="px-2 py-1">
            <div className="p-[5px] relative flex gap-2 outline-1 outline-gray-200 rounded-[3px] cursor-pointer hover:bg-gray-50">

                <div className="w-[40px] h-[45px] rounded-[2px] bg-gray-100 outline-1 outline-gray-200
                 flex justify-center items-center">
                    {src && (
                        <div className='w-full h-full'>
                        {isImage && (
                            <img
                            src={src}
                            alt={file.name}
                            className="w-full h-full object-cover rounded"
                            />
                        )}
                        {isVideo && (
                            <video
                            src={src}
                            controls
                            className="w-full max-h-40 rounded"
                            />
                        )}
                        {!isImage && !isVideo && (
                            <HugeiconsIcon className='text-gray-400' size={20} icon={File01Icon} />
                        )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-between py-[1px] flex-1">
                    <div className="text-gray-600 text-[13px] truncate">{file.name}</div>
                    <div className="text-gray-400 font-Inter text-[12px]">{bytesToMB(file.size)}</div>
            
                </div>

                <div className='absolute top-[-7px] right-[-7px] rounded-[50%]
                w-[20px] h-[20px] bg-gray-50 outline-1 outline-gray-300 
                flex justify-center items-center hover:bg-gray-200'
                    onClick={() => {
                        removeFile(file)
                    }}
                >
                    <HugeiconsIcon className='text-gray-500' size={14} icon={Cancel01Icon} />
                </div>
            
            </div>

        </div>
    );
}