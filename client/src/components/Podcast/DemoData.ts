import { Podcast } from "./PodcastWorkspace";



const TOTAL = 760;

export const DEMO: Podcast = {
  id: "memory-demo",
  title: "How memory works",
  duration: TOTAL,
  description:
    "A conversation about remembering more, forgetting less, and making your study time count.",
    
  chapters: [
    {
      id: "forget",
      title: "Why we forget",
      description:
        "What happens to the things we learn — and why forgetting is part of the process.",
      start: 0,
    },
    {
      id: "form",
      title: "How memories form",
      description:
        "From a passing thought to a lasting memory. Meet the connections behind learning.",
      start: 95,
    },
    {
      id: "recall",
      title: "Active recall explained",
      description:
        "Why bringing an answer to mind helps more than reading it one more time.",
      start: 250,
    },
    {
      id: "spacing",
      title: "Spacing your study sessions",
      description:
        "Give your brain a little room. Find a rhythm that makes your knowledge stick.",
      start: 415,
    },
    {
      id: "practice",
      title: "Putting it into practice",
      description:
        "Turn the science into a simple routine for your next study session.",
      start: 610,
    },
  ],
  transcript: [
    {
      id: "t0",
      speaker: "Alex",
      start: 0,
      text: "You finish a chapter, close the book, and feel like you understand everything. Then the next day, explaining it is surprisingly difficult. Why does that happen?",
    },
    {
      id: "t1",
      speaker: "Maya",
      start: 38,
      text: "Recognizing an explanation and recalling it independently are different tasks. When the page is in front of you, it gives you clues. Without those clues, you find out what you can actually retrieve.",
    },
    {
      id: "t2",
      speaker: "Alex",
      start: 95,
      text: "So let's follow a memory from the beginning. When I learn a new idea, am I storing a little recording somewhere?",
    },
    {
      id: "t3",
      speaker: "Maya",
      start: 136,
      text: "It is more useful to think about connections. You connect the new idea to things you already know. Attention matters, and so does making sense of the material instead of simply repeating the words.",
    },
    {
      id: "t4",
      speaker: "Alex",
      start: 198,
      text: "Like connecting a new term to an example from my own life. That gives me another way to reach the idea later, instead of only remembering where it sat on the page.",
    },
    {
      id: "t5",
      speaker: "Maya",
      start: 250,
      text: "Exactly. Now add active recall: put the material away and try to explain it. You might answer a question, use a flashcard, or sketch a process from memory.",
    },
    {
      id: "t6",
      speaker: "Alex",
      start: 292,
      text: "But that feels harder than rereading. Sometimes I stare at a question and realize I can't quite find the answer. Is that still a useful study session?",
    },
    {
      id: "t7",
      speaker: "Maya",
      start: 320,
      text: "Yes — the effort of retrieving an idea is part of the practice. Try to answer, then check your source. That feedback helps you notice gaps and correct mistakes before they become familiar.",
    },
    {
      id: "t8",
      speaker: "Alex",
      start: 368,
      text: "So the goal isn't to prove I know everything. It's to discover what needs another look. I could finish a section by writing three questions and answering them with the book closed.",
    },
    {
      id: "t9",
      speaker: "Maya",
      start: 415,
      text: "And you don't have to answer all of them ten times in a row. Return to them across different study sessions. Spacing gives you opportunities to retrieve the material after a break.",
    },
    {
      id: "t10",
      speaker: "Alex",
      start: 475,
      text: "How should I choose the gaps? I often hear that there is one perfect schedule, but my subjects and deadlines are very different.",
    },
    {
      id: "t11",
      speaker: "Maya",
      start: 530,
      text: "Start with a manageable plan and adjust. Revisit difficult ideas sooner, and give familiar ones a longer gap. The schedule should help you keep practicing, rather than become another thing to worry about.",
    },
    {
      id: "t12",
      speaker: "Alex",
      start: 610,
      text: "Let's make that concrete. Tomorrow I'll study one topic, close my notes, and explain the main idea aloud. Then I'll check what I missed and make a few focused questions.",
    },
    {
      id: "t13",
      speaker: "Maya",
      start: 670,
      text: "Then come back to those questions in another session. Keep the answers in your own words, check the details, and revise your plan as you go. A small routine you repeat is a good place to begin.",
    },
    {
      id: "t14",
      speaker: "Alex",
      start: 723,
      text: "Understand it, retrieve it, check it, and return to it. That's a much clearer plan than simply hoping another hour of reading will make everything stick.",
    },
  ],
};