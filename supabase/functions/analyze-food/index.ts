import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert food quality analyst. Analyze the provided image and return a detailed assessment.

FIRST, determine if the image contains food. If it does NOT contain food, respond with:
{
  "isFood": false,
  "message": "This image doesn't appear to contain food. Please upload a clear photo of food for quality analysis."
}

If the image DOES contain food, analyze it across these 5 criteria and provide a JSON response:

{
  "isFood": true,
  "overallScore": <number 0-100>,
  "qualityRating": "<Excellent|Good|Fair|Poor>",
  "aspects": {
    "presentation": {
      "score": <number 0-100>,
      "comment": "<brief comment about food arrangement and styling>"
    },
    "freshness": {
      "score": <number 0-100>,
      "comment": "<brief comment about how fresh ingredients appear>"
    },
    "color": {
      "score": <number 0-100>,
      "comment": "<brief comment about color vibrancy and appeal>"
    },
    "texture": {
      "score": <number 0-100>,
      "comment": "<brief comment about visual texture quality>"
    },
    "plating": {
      "score": <number 0-100>,
      "comment": "<brief comment about professional plating and arrangement>"
    }
  },
  "positivePoints": ["<point 1>", "<point 2>", "<point 3>"],
  "improvements": ["<suggestion 1>", "<suggestion 2>"],
  "summary": "<A 1-2 sentence overall assessment of the food quality>",
  "recommendation": "<Approved for donation|Approved with minor concerns|Needs review before donation|Not recommended for donation>"
}

Be thorough but concise. Focus on food safety and donation suitability.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image for quality and donation suitability. Return only valid JSON.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response - handle potential markdown code blocks
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      analysisResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse analysis results");
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-food error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
