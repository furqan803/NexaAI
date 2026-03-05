import { Platform } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// API KEYS — Loaded from .env file (VITE_ prefix required for Vite)
// ─────────────────────────────────────────────────────────────────────────────
const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY as string;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────────────────────────────────────
// GROQ LLM CALL — Generic function
// ─────────────────────────────────────────────────────────────────────────────
async function callGroq(systemPrompt: string, userPrompt: string, temperature = 0.3): Promise<string> {
  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// SERPER — Google Search API
// ─────────────────────────────────────────────────────────────────────────────
async function searchGoogle(query: string): Promise<string> {
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 6 }),
    });

    if (!response.ok) throw new Error(`Serper API Error: ${response.status}`);

    const data = await response.json();
    let context = "";

    // Answer box (direct answer from Google)
    if (data.answerBox) {
      const ab = data.answerBox;
      context += `📌 Direct Answer: ${ab.answer || ab.snippet || ab.title || ""}\n\n`;
    }

    // Knowledge graph
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      context += `📚 Knowledge: ${kg.title || ""} — ${kg.description || ""}\n\n`;
    }

    // Organic results
    const organicResults = data.organic?.slice(0, 5) ?? [];
    for (const r of organicResults) {
      context += `🔗 Source: ${r.link}\n📝 ${r.title}\n${r.snippet}\n\n`;
    }

    return context || "No search results found.";
  } catch (err) {
    console.warn("Serper search failed:", err);
    return "Search results unavailable — answering from training data.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// URL CONTENT SCRAPER — Fetch & extract text from a URL
// ─────────────────────────────────────────────────────────────────────────────
async function scrapeUrl(url: string): Promise<string> {
  // Use allorigins proxy to bypass CORS
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const data = await response.json();
    const html: string = data.contents ?? "";

    // Strip HTML tags and extract meaningful text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{3,}/g, "\n\n")
      .trim();

    // Return first 4000 chars to stay within token limits
    return text.substring(0, 4000) || "Could not extract meaningful content from URL.";
  } catch (err) {
    console.warn("URL scrape failed:", err);
    return `Could not fetch content from ${url}. Will generate posts based on the URL domain and topic.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AskNow AI — Google Search + Groq LLM (exact same logic as your Colab code)
// ─────────────────────────────────────────────────────────────────────────────
export async function askNowQuery(question: string): Promise<string> {
  // Step 1: Google Search (same as your academic_bot function)
  const searchContext = await searchGoogle(question);

  // Step 2: Groq LLM call (same system prompt as your Colab)
  const systemPrompt =
    "You are AskNow AI, a helpful and knowledgeable assistant. Use the provided Google search context to answer questions accurately and comprehensively. Format your response clearly with relevant details. If the search context is insufficient, use your training knowledge.";

  const userPrompt = `Question: ${question}\n\nGoogle Search Context:\n${searchContext}`;

  try {
    const answer = await callGroq(systemPrompt, userPrompt, 0.5);
    return answer;
  } catch (err) {
    console.error("AskNow error:", err);
    throw new Error(
      err instanceof Error ? err.message : "AskNow AI se jawab nahi aaya. Please try again."
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Post Gen — URL Scrape + Groq LLM (same logic as your Colab CrewAI agents)
// Agent 1 (Researcher): Scrape URL and extract key facts
// Agent 2 (Writer): Generate platform-specific posts
// ─────────────────────────────────────────────────────────────────────────────
export async function generatePosts(
  urlOrTopic: string,
  platforms: Platform[]
): Promise<Record<Platform, string>> {
  const isUrl =
    urlOrTopic.startsWith("http://") ||
    urlOrTopic.startsWith("https://") ||
    urlOrTopic.startsWith("www.");

  // ── Step 1: Researcher Agent — Extract key facts ──────────────────────────
  let researchedFacts = "";

  if (isUrl) {
    // Scrape the actual URL (same as ScrapeWebsiteTool in CrewAI)
    const scrapedContent = await scrapeUrl(urlOrTopic);

    const researcherSystem =
      "You are a Research Lead expert at extracting key facts and core messages from website content. Extract the most important and interesting facts that would be valuable for social media posts.";

    const researcherPrompt = `Analyze this website content from ${urlOrTopic} and extract 5-8 key facts, main message, and important highlights:\n\n${scrapedContent}`;

    try {
      researchedFacts = await callGroq(researcherSystem, researcherPrompt, 0.3);
    } catch {
      researchedFacts = `Website: ${urlOrTopic}\nContent about this topic was extracted for social media post generation.`;
    }
  } else {
    // Topic-based — search Google for context
    const googleContext = await searchGoogle(urlOrTopic);

    const researcherSystem =
      "You are a Research Lead expert at gathering and summarizing information on any topic. Extract key facts that would be engaging for social media.";

    const researcherPrompt = `Research this topic: "${urlOrTopic}"\n\nGoogle Search Context:\n${googleContext}\n\nExtract 5-8 key facts and highlights.`;

    try {
      researchedFacts = await callGroq(researcherSystem, researcherPrompt, 0.3);
    } catch {
      researchedFacts = `Topic: ${urlOrTopic}\nKey information gathered for post generation.`;
    }
  }

  // ── Step 2: Writer Agent — Generate platform-specific posts ───────────────
  // (same as your Social Media Architect agent with exact format)
  const platformsNeeded = platforms.length > 0 ? platforms : (["facebook", "linkedin", "twitter"] as Platform[]);

  const platformInstructions = platformsNeeded
    .map((p) => {
      if (p === "facebook")
        return "### Facebook\n[Engaging Facebook post with emojis, 150-300 words, conversational tone, call to action, hashtags]";
      if (p === "linkedin")
        return "### LinkedIn\n[Professional LinkedIn post, 200-400 words, business tone, insights, 3-5 key points, professional hashtags]";
      if (p === "twitter")
        return "### Twitter\n[Twitter/X thread or single tweet, max 280 chars per tweet, punchy, use thread format with 1/ 2/ 3/ if needed, trending hashtags]";
      return "";
    })
    .join("\n\n");

  const writerSystem = `You are a Social Media Architect — a master of creating platform-specific viral content. 
You know that each platform needs different tone, length, and style:
- Facebook: Conversational, emotional, community-focused
- LinkedIn: Professional, insights-driven, thought leadership  
- Twitter/X: Punchy, concise, thread-friendly

CRITICAL: You MUST use EXACTLY this format with these exact headings:

${platformInstructions}

Use --- to separate sections. Write compelling, authentic posts that get engagement.`;

  const writerPrompt = `Based on this research, create engaging social media posts:\n\n${researchedFacts}\n\nSource: ${urlOrTopic}`;

  let rawOutput = "";
  try {
    rawOutput = await callGroq(writerSystem, writerPrompt, 0.7);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Post Gen se posts generate nahi ho sake."
    );
  }

  // ── Parse the raw output into per-platform sections ───────────────────────
  return parsePostGenResponse(rawOutput, platformsNeeded);
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse Post Gen raw output into platform-specific sections
// ─────────────────────────────────────────────────────────────────────────────
function parsePostGenResponse(
  raw: string,
  platforms: Platform[]
): Record<Platform, string> {
  const result: Record<Platform, string> = {
    facebook: "",
    linkedin: "",
    twitter: "",
  };

  // Extract each section using regex (handles ###, ##, or # headings)
  const fbMatch = raw.match(
    /#{1,3}\s*Facebook[\s\S]*?\n([\s\S]*?)(?=#{1,3}\s*(LinkedIn|Twitter|X\b)|$)/i
  );
  const liMatch = raw.match(
    /#{1,3}\s*LinkedIn[\s\S]*?\n([\s\S]*?)(?=#{1,3}\s*(Facebook|Twitter|X\b)|$)/i
  );
  const twMatch = raw.match(
    /#{1,3}\s*(Twitter|X)[\s\S]*?\n([\s\S]*?)(?=#{1,3}\s*(Facebook|LinkedIn)|$)/i
  );

  if (fbMatch) result.facebook = cleanSection(fbMatch[1]);
  if (liMatch) result.linkedin = cleanSection(liMatch[1]);
  if (twMatch) result.twitter = cleanSection(twMatch[2] ?? twMatch[1] ?? "");

  // Fallback — if parsing fails, try splitting by ---
  if (!result.facebook && !result.linkedin && !result.twitter) {
    const parts = raw.split(/---+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      result.facebook = parts[0];
      result.linkedin = parts[1];
      result.twitter = parts[2];
    } else if (parts.length === 2) {
      result.facebook = parts[0];
      result.linkedin = parts[1];
      result.twitter = parts[1];
    } else {
      // Last resort — put everything in all requested platforms
      for (const p of platforms) {
        result[p] = raw.trim();
      }
    }
  }

  // Only return requested platforms (fill empty ones with fallback)
  for (const p of platforms) {
    if (!result[p]) {
      result[p] = `Post for ${p} could not be parsed. Raw output:\n\n${raw.substring(0, 500)}`;
    }
  }

  return result;
}

function cleanSection(text: string): string {
  return text
    .replace(/^---\s*/gm, "")
    .replace(/^\s*\[.*?\]\s*/gm, "") // remove placeholder brackets like [Insert content here]
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Conversation Title Generation
// ─────────────────────────────────────────────────────────────────────────────
export async function generateConversationTitle(prompt: string): Promise<string> {
  const systemPrompt = "You are a helpful assistant that generates a very short (max 4-5 words), relevant title for a conversation based on the user's first prompt. Do not use quotes or any introductory text. Return only the title.";
  const userPrompt = `First prompt: "${prompt}"\n\nGenerate title:`;

  try {
    const title = await callGroq(systemPrompt, userPrompt, 0.7);
    return title.replace(/['"]/g, '').trim(); // Remove any stray quotes
  } catch (err) {
    console.warn("Title generation failed:", err);
    return prompt.length > 30 ? prompt.substring(0, 30) + "…" : prompt;
  }
}

