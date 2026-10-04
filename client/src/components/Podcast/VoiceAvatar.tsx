import { useEffect, useState } from "react";
import { PodcastVoice } from "./podcastVoices";
import { Headphones } from "lucide-react";


export default function VoiceAvatar({
  voice,
  large = false,
}: {
  voice?: PodcastVoice;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [voice?.avatarUrl]);
  return (

    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 font-medium
         text-gray-600 ${large ? "h-18  w-18 text-base" : "h-13 w-13 text-sm"}`}
    >
      {voice?.avatarUrl && !failed ? (
        <img
          src={voice.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : voice ? (
        voice.name.slice(0, 1).toUpperCase()
      ) : (
        <Headphones size={18} />
      )}
    </span>
    
  );
}