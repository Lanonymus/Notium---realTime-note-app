export default function TextFile({ file, removeFile }) {

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
        <div className={`mt-1 outline-1 items-center
             outline-gray-200 overflow-hidden ${isAudio ? "rounded-[25px]" : "rounded-[3px] bg-gradient-to-tr from-gray-300 to-gray-50"}`}>
                {src && (
                    <div className="w-auto relative max-h-40 group">
                        {isImage && (
                            <img
                                src={src}
                                alt={file.name}
                                className="w-full h-full object-cover object-center cursor-pointer"
                            />
                        )}
                        <div className='absolute opacity-0 group-hover:opacity-100 cursor-pointer duration-100 flex flex-col justify-end
                        py-2 px-3 bottom-0 left-0 bg-gradient-to-t w-full h-[75px] from-[#111111] to-[#ffffff00]'>
                            <div className='w-full text-white text-[13px] font-Inter'>{file.name}</div>
                            <div className='w-full text-gray-50 text-[13px] font-Inter'>{bytesToMB(file.size)}</div>
                        </div>
                        {isVideo && (
                            <video
                                src={src}
                                controls
                                className="w-full max-h-40"
                            />
                        )}
                        {isAudio && (
                            <audio
                                src={src}
                                controls
                                className='rounded-[0] w-full h-[50px]'
                            />
                        )}
                        {!isImage && !isVideo && !isAudio && (
                            <div className="text-gray-500 text-sm">Preview not available</div>
                        )}

                    </div>
                )}
        </div>
    );
}