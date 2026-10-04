export const difficultyInstructions: Record<string, string> = {
    easy: `
        EASY

        Create straightforward recall questions.

        Focus mainly on:
        - basic definitions
        - key facts
        - simple terminology
        - direct relationships

        The learner should be able to answer by recalling a clearly presented fact from the note.

        Avoid:
        - multi-step reasoning
        - combining several concepts
        - subtle distinctions
    `,

    medium: `
        MEDIUM

        Create questions that require understanding and active recall.

        Focus on:
        - explaining concepts
        - relationships between concepts
        - causes and effects
        - comparing related ideas
        - applying information from the note in a simple context

        Some questions may require connecting two pieces of information from the note.
    `,

    hard: `
        HARD

        Create questions that require deeper understanding and reasoning.

        Focus on:
        - comparing concepts
        - explaining why something happens
        - connecting multiple concepts
        - applying concepts to situations
        - distinguishing between similar ideas
        - multi-step reasoning based strictly on the note

        Avoid questions that can be answered by recalling a single isolated fact.
    `,

    extreme: `
        EXTREME

        Create challenging questions that require strong understanding, synthesis, and multi-step reasoning.

        Focus on:
        - integrating multiple concepts
        - analyzing relationships
        - identifying implications
        - explaining complex cause-and-effect chains
        - distinguishing subtle conceptual differences
        - applying several concepts simultaneously

        Questions should require the learner to reconstruct or reason through the information rather than simply remember a sentence from the note.

        Every answer must still be fully supported by the note.
        `
};