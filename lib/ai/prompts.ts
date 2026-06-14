export function getMeetingSystemPrompt({
  meetingTitle,
  notesContent,
  transcriptText,
  actionItems,
  preferredStyle = "concise",
}: {
  meetingTitle?: string;
  notesContent?: string;
  transcriptText?: string;
  actionItems?: string[];
  preferredStyle?: string;
}): string {
  const styleGuide = {
    concise: "Be concise and direct. Use bullet points. Avoid padding.",
    detailed: "Be thorough and detailed. Include context and reasoning.",
    executive: "Focus on business impact, decisions, and risks. Executive summary style.",
    technical: "Include technical details and implementation specifics.",
  }[preferredStyle] ?? "Be concise and direct.";

  let context = `You are MeetFlow AI — an intelligent meeting co-pilot. Your job is to help the user understand, organize, and act on their meeting content.

${styleGuide}

Current date: ${new Date().toISOString().split("T")[0]}`;

  if (meetingTitle) {
    context += `\n\nMeeting: ${meetingTitle}`;
  }

  if (notesContent) {
    context += `\n\nMeeting Notes:\n${notesContent}`;
  }

  if (transcriptText) {
    context += `\n\nTranscript:\n${transcriptText.slice(0, 8000)}`;
  }

  if (actionItems && actionItems.length > 0) {
    context += `\n\nCurrent Action Items:\n${actionItems.map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
  }

  context += `\n\nWhen asked to extract or list things, be structured and specific. Always ground your answers in the provided meeting content.`;

  return context;
}

export function getSummarizePrompt(content: string, style: string): string {
  return `Analyze the following meeting content and produce a structured summary.

Style: ${style}
Content:
${content.slice(0, 10000)}

Extract all key decisions, action items, risks, and summarize the meeting clearly.`;
}

export function getExtractPrompt(content: string): string {
  return `Extract all action items from the following meeting content. For each action item, identify:
- The task to be done
- Who is responsible (if mentioned by name or email)
- When it's due (if mentioned)
- Priority level (infer from urgency language)

Content:
${content.slice(0, 10000)}`;
}

export function getSuggestPrompt(content: string): string {
  return `Based on this meeting content, suggest next steps, identify potential risks, and propose alternatives where appropriate.

Content:
${content.slice(0, 10000)}`;
}

export function getSentimentPrompt(text: string): string {
  return `Analyze the sentiment of this meeting transcript. Return an overall sentiment score from -1 (very negative) to 1 (very positive), and identify key segments that influenced the score.

Transcript:
${text.slice(0, 5000)}`;
}
