import { Fragment } from "react";
import type { Utterance } from "./podcastTypes";

/** Non-nested native buttons support mouse, touch, Tab and Enter/Space.
 * Character offsets preserve original whitespace and punctuation, including CJK.
 * Old/demo transcripts without real word timestamps remain plain text.
 */
export function TranscriptWords({
  utterance,
  time,
  onSeek,
  available,
  highlight,
}: {
  utterance: Utterance;
  time: number;
  onSeek: (seconds: number) => void;
  available: boolean;
  highlight: boolean;
}) {

  if (!utterance.words?.length) return <>{utterance.text}</>;
  let cursor = 0;
  return (
    <>
      {utterance.words.map((word) => {
        const before = utterance.text.slice(cursor, word.charStart);
        cursor = word.charEnd;
        const current = highlight && time >= word.start && time < word.end;
        // console.log(current ? word : "");
        
        
        return (
          <Fragment key={word.id}>
            {before}
            <button
              type="button"
              disabled={!available}
              onClick={() => onSeek(word.start)}
              aria-current={current ? "true" : undefined}
              aria-label={`Jump to ${word.text}, ${word.start.toFixed(1)} seconds`}
              title={`Jump to ${word.start.toFixed(1)}s`}
              className={`inline rounded px-0.5 py-0.5 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-blue-600 disabled:cursor-default 
                 ${current ? "bg-blue-600 text-white" : "bg-transparent text-inherit hover:bg-blue-100"}`}
            >
              {utterance.text.slice(word.charStart, word.charEnd)}
            </button>
          </Fragment>
        );
      })}
      {utterance.text.slice(
        utterance.words[utterance.words.length - 1].charEnd,
      )}
    </>
  );
}
