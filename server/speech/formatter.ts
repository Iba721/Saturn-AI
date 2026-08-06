export function formatForSpeech(text: string): string {
  let formatted = text;

  // Remove extra spaces
  formatted = formatted.replace(/\s+/g, " ").trim();

  // Remove markdown bold
  formatted = formatted.replace(/\*\*/g, "");

  // Replace bullet points
  formatted = formatted.replace(/•/g, ".");

  // Remove code blocks
  formatted = formatted.replace(/```[\s\S]*?```/g, "");

  // Replace URLs
  formatted = formatted.replace(
    /https?:\/\/\S+/g,
    "the provided website"
  );

  return formatted;
}