import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { Movie, TMDBResponse } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_TOKEN = process.env.TMDB_TOKEN!;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

type InputAnswers = {
  format?: string;
  mood?: string;
  company?: string;
  genre?: string;
  discovery?: string;
};

type GeminiChoice = {
  title: string;
  type: "movie" | "tv";
  reason: string;
};

type GeminiPayload = {
  titles: GeminiChoice[];
};

function parseGeminiJson(text: string): GeminiPayload | null {
  try {
    return JSON.parse(text) as GeminiPayload;
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned) as GeminiPayload;
    } catch {
      return null;
    }
  }
}

async function searchTmdbTitle(
  title: string,
  preferredType: "movie" | "tv"
): Promise<(Movie & { media_type: "movie" | "tv" }) | null> {
  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("query", title);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as TMDBResponse<Movie>;

  const candidates = (data.results || []).filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  ) as (Movie & { media_type: "movie" | "tv" })[];

  return (
    candidates.find((item) => item.media_type === preferredType) ||
    candidates[0] ||
    null
  );
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in environment variables." },
      { status: 500 }
    );
  }

  let body: InputAnswers;
  try {
    body = (await request.json()) as InputAnswers;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { format, mood, company, genre, discovery } = body;
  if (!format || !mood || !company || !genre || !discovery) {
    return NextResponse.json(
      { error: "Please answer all the questions." },
      { status: 400 }
    );
  }

  const prompt = `
You are an expert film and TV curator. Recommend titles a real person would love tonight.

User profile:
- wants to watch: ${format} (movie / tv / either)
- mood / experience they want: ${mood}
- who they are watching with: ${company}
- genre they lean toward: ${genre}
- discovery style: ${discovery}

How to interpret "who they are watching with":
- solo: anything fitting, can be niche or heavy.
- partner: shared appeal, date-night friendly, avoid anything that kills the mood.
- family: family-friendly and safe for kids, avoid graphic violence, sex, or disturbing content.
- friends: fun, easy to follow together, crowd-pleasing, great for a group.

How to interpret "discovery style":
- popular: well-known, widely loved crowd-pleasers.
- hidden: lesser-known high-quality gems, avoid obvious blockbusters everyone has seen.
- acclaimed: critically acclaimed or award-winning, strong reviews.
- surprise: unexpected but still a great fit for the rest of the profile.

Return EXACTLY 3 recommendations in JSON with this shape only:
{
  "titles": [
    { "title": "string", "type": "movie or tv", "reason": "short personal reason under 18 words, speak to the user" }
  ]
}

Rules:
- type must be either "movie" or "tv".
- if "wants to watch" is "movie", return 3 movies; if "tv", return 3 series; if "either", mix naturally.
- the 3 picks must be distinct and genuinely match the mood, genre and company.
- only return real, known titles that exist on TMDB.
- do not include markdown or code fences.
  `.trim();

  try {
    if (!ai) {
      return NextResponse.json(
        { error: "Gemini client is not configured." },
        { status: 500 }
      );
    }

    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const rawText = (geminiRes.text || "").trim();
    const parsed = parseGeminiJson(rawText);

    if (!parsed?.titles?.length) {
      return NextResponse.json(
        { error: "Could not parse AI recommendations." },
        { status: 502 }
      );
    }

    const picked = parsed.titles.slice(0, 3);
    const found = await Promise.all(
      picked.map(async (entry) => {
        const type = entry.type === "tv" ? "tv" : "movie";
        const item = await searchTmdbTitle(entry.title, type);
        if (!item) return null;
        return {
          id: item.id,
          type: item.media_type,
          title: item.title || item.name || entry.title,
          overview: item.overview || "",
          poster_path: item.poster_path,
          vote_average: item.vote_average || 0,
          year:
            (item.release_date || item.first_air_date)?.split("-")[0] || null,
          reason: entry.reason,
        };
      })
    );

    const recommendations = found.filter(Boolean);
    if (!recommendations.length) {
      return NextResponse.json(
        { error: "No matching titles were found on TMDB." },
        { status: 404 }
      );
    }

    return NextResponse.json({ recommendations: recommendations.slice(0, 3) });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}
