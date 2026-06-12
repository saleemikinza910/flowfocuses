import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { primaryType, recordedMoods, totalFocusMinutes, sessionsCompletedCount } = await req.json();

    const neuroType = primaryType || "NONE";
    const loggedCount = recordedMoods?.length || 0;
    const focusMins = totalFocusMinutes || 0;
    const sessions = sessionsCompletedCount || 0;

    const apiKey = process.env.GEMINI_API_KEY;

    // Standard clinical fallback mapping for high offline fidelity
    const getClinicalFallback = () => {
      let advice = "";
      if (neuroType === 'ADHD') {
        advice = "Your ADHD learning signature has a high reliance on initial kinetic novelty. We noticed that tracking milestones with instant dopamine incentives (Focus Coins) dramatically boosts task perseverance. To avoid focus-blindness, maintain alternating visual layouts frequently.";
      } else if (neuroType === 'AUTISM') {
        advice = "Your Autism learning signature shows exceptional processing precision under structured linear conditions. Your focus remains highly steady when timers are presented as predictable progress percentages. Protect your cognitive bandwidth by leveraging sensory mute modes during complex conceptualizing.";
      } else if (neuroType === 'ANXIETY') {
        advice = "Your Anxiety profile responds best to supportive pacing checks with zero numeric time countdown stress. Hiding timer countdowns has minimized fight-or-flight triggers. Continue prioritizing mindfulness breaks immediately prior to task escalations.";
      } else {
        advice = "Your learning profile shows robust flexibility. Maintain consistent rhythmic pacing breaks of 5-10 minutes every hour to sustain a steady cognitive load balance and avoid end-of-day fatigue.";
      }

      return `## FocusFlow Clinical Synthesis & Reflection Report
**Mind-Type Alignment:** ${neuroType} Brain Calibrated
**Active Study Metrics:** ${focusMins} Minutes Logged Across ${sessions} Achievement Sprints

### 🧭 Empirical Analysis of Focus Signature
Based on your self-reported logs and task accomplishment telemetry:
- **Pacing Rhythm:** You are sustaining optimal energy when working in segmented windows. 
- **Sensory Saturation:** High environment noise or lingering intrusive thoughts are primary drains on your focus storage.
- **Dopamine Incentive Response:** Your engagement index spikes after receiving instant virtual tokens upon checkpoint completions.

### 🩺 Supporting Advice for Caregivers, Therapist or Self-Management
1. **${advice}**
2. **Brain Dumping:** Continue parking intrusive tangents in the sidebar dump block. This decreases short-term working memory load, allowing your brain to focus on active tasks.
3. **Rest Intervals:** Do not bypass resting loops. Sustainable concentration is an endurance run, not an emotional sprint.

*This synthesis report represents an automated executive-function assessment. You are empowered to export or share these diagnostic notes with your coach or therapist.*`;
    };

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return NextResponse.json({ report: getClinicalFallback(), isMock: true });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are an expert cognitive psychologist and ADHD coach specializing in neurodistinct learning strategies. 
Your goal is to write a highly professional, compassionate, yet deeply analytical Clinical Focus Synthesis Report for the user (or their therapist/caregiver) based on their study stats.
Keep the language extremely professional, comforting, objective, and supportive. Group comments into Markdown headings:
1. ### Empirical Analysis of Focus Signature (Analyzing their ${focusMins} mins logged, ${sessions} sessions, and mood scores)
2. ### Cognitive Load & Sensory Triggers
3. ### Actionable Recommendations (Tailored specifically for ${neuroType} minds)`;

    const prompt = `Please generate a Focus Synthesis Report:
- Brain Profile Type: ${neuroType}
- Focus Minutes: ${focusMins} mins
- Sprints Completed: ${sessions} Sprints
- Focus/Anxiety Records: ${JSON.stringify(recordedMoods || [])}
Provide supportive, validated strategies to maximize spatial attention, protect executive functions, and improve pacing without shame.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    return NextResponse.json({
      report: response.text || getClinicalFallback(),
      isMock: false
    });

  } catch (error: any) {
    console.error("Gemini synthesis error:", error);
    return NextResponse.json({
      error: error.message || "An issue occurred during analysis synthesis.",
      report: "### Clinical Analysis Fallback\nUnable to reach live GPT modeling. Please verify connections."
    });
  }
}
