export function formatForSpeech(text: string): string {
  let formatted = text;

  // Code blocks first — strip entirely, but leave a pause where they
  // were so surrounding sentences don't collide into each other.
  formatted = formatted.replace(/```[\s\S]*?```/g, ". ");

  // Inline code — keep the content, drop the backticks. Otherwise a
  // snippet like `npm install` gets read aloud with literal backtick
  // characters, which most TTS engines mangle or vocalize oddly.
  formatted = formatted.replace(/`([^`]+)`/g, "$1");

  // Markdown links: keep the visible text, drop the URL entirely.
  // Doing this before the bare-URL pass means a linked URL never
  // gets caught twice.
  formatted = formatted.replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, "$1");

  // Any remaining bare URLs.
  formatted = formatted.replace(/https?:\/\/\S+/g, "the provided website");

  // Headers ("# Title", "## Section") — strip the marker, keep the text.
  formatted = formatted.replace(/^#{1,6}\s+/gm, "");

  // Horizontal rules on their own line.
  formatted = formatted.replace(/^[-*_]{3,}\s*$/gm, "");

  // Bullet markers at the start of a line — strip the symbol, keep
  // the content. The line break itself is preserved here and turned
  // into a pause in the pacing step below, so list items still read
  // as separate spoken beats instead of running together.
  formatted = formatted.replace(/^[\s]*[-*•]\s+/gm, "");

  // Bold / italic emphasis — keep the wrapped text, drop the markers.
  // Non-greedy so "**a** and **b**" doesn't collapse into one match.
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "$1");
  formatted = formatted.replace(/\*(.+?)\*/g, "$1");

  formatted = formatted.replace(/Anant Shivhare/gi, "UH-nunt Shiv-haa-ray");

  // Emoji — most TTS engines either skip them silently or, worse,
  // try to vocalize a description of the glyph. Strip rather than
  // risk either outcome.
  formatted = formatted.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu,
    "",
  );

  // Pacing: any remaining line breaks (paragraph breaks, former list
  // item boundaries) become a spoken pause instead of vanishing
  // entirely under the whitespace collapse below.
  formatted = formatted.replace(/\n+/g, ". ");

  // Final cleanup — collapse whitespace and fix any double
  // punctuation the steps above may have introduced (e.g. a
  // sentence that already ended in "." picking up another one
  // from the pacing step).
  formatted = formatted.replace(/\s+/g, " ");
  formatted = formatted.replace(/\.\s*\./g, ".");
  formatted = formatted.replace(/\s+\./g, ".");
  formatted = formatted.trim();

  return formatted;
}