import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, complexity, primaryType } = await req.json();

    const taskTitle = title || "Complete my task";
    const taskDesc = description || "";
    const compScore = complexity || 5;
    const neuroType = primaryType || "NONE";

    // Detect if we have an API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback helper when the Gemini key is not defined, 
      // preventing user crashes and preserving perfect offline utility.
      const fallbackSteps = getFallbackBreakdown(taskTitle, neuroType, compScore);
      return NextResponse.json({ steps: fallbackSteps, isMock: true });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const neurotypeGuides = {
      ADHD: "ADHD Brain Needs: break the task into extremely small, actionable 5-15 minute increments. Include playful reward suggestions (e.g., 'Do 10 jumping jacks', 'Drink chocolate milk') and use highly energizing, encouraging language. Keep steps visually separate and punchy.",
      AUTISM: "Autistic Brain Needs: provide clear, literal, explicit instructions. Remove all ambiguity. Ensure steps contain exact preparation (e.g., 'Collect notebook, pen, and close extra tabs') and logical sequencing. Use highly structure, neutral, and direct language.",
      DYSLEXIA: "Dyslexia Brain Needs: use simple, concrete wording. Suggest highly visual strategies (e.g., 'Sketch a flow outline on paper', 'Mind map it in colors'). Avoid text-heavy logs. Ensure steps are short sentences, easy-to-read, and bulleted.",
      ANXIETY: "Anxiety Brain Needs: focus heavily on calming reassurance and validating support. Break down any looming pressure. Tell the user often that taking a pause is perfectly fine, and set 'good enough' standards rather than strict perfection metrics.",
      NONE: "General Brain Needs: create an organized, balanced, and direct sequencing of actions to accomplish the task successfully."
    };

    const guide = neurotypeGuides[neuroType as keyof typeof neurotypeGuides] || neurotypeGuides.NONE;

    const systemInstruction = `You are a professional executive-function and cognitive learning coach specializing in neuro-diverse learning strategies.
Your task is to break down a larger, potentially overwhelming goal into smaller, manageable, hyper-actionable sub-steps.

${guide}

IMPORTANT RULES:
- Restructure the steps so that more complex tasks get more small, manageable pieces.
- Every step MUST have:
  1. "step": A short, direct, empowering title.
  2. "time": Approximate duration in minutes (integer between 5 and 25).
  3. "tip": A helpful, specific micro-coaching tip tailored for a ${neuroType} profile.
  4. "reward": A tiny dopamine reward suggest or calming breather tip (string).
- You MUST respond ONLY with a raw JSON object matching the requested schema.`;

    const prompt = `Task Title: "${taskTitle}"
Task Description: "${taskDesc}"
Perceived Complexity Level: ${compScore}/10
Neuro-diverse profile to adapt for: ${neuroType}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["steps"],
          properties: {
            steps: {
              type: Type.ARRAY,
              description: "The list of sub-steps to break down this task",
              items: {
                type: Type.OBJECT,
                required: ["step", "time", "tip", "reward"],
                properties: {
                  step: { type: Type.STRING, description: "Actionable name of this step" },
                  time: { type: Type.INTEGER, description: "Required time in minutes" },
                  tip: { type: Type.STRING, description: "Micro-coaching tip adapted for the student's brain-type" },
                  reward: { type: Type.STRING, description: "Dopamine reward or mental relief micro-cue" }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return NextResponse.json({
      steps: parsedData.steps || getFallbackBreakdown(taskTitle, neuroType, compScore),
      isMock: false
    });

  } catch (error: any) {
    console.error("Gemini breakdown error:", error);
    return NextResponse.json({
      error: error.message || "An issue occurred during AI breakdown.",
      steps: getFallbackBreakdown("Complete my task", "NONE", 5)
    }, { status: 200 }); // Return status 200 with fallback to prevent client crash
  }
}

// Highly customized rule-based fallback generator for offline resilience and speedy testing
function getFallbackBreakdown(title: string, type: string, complexity: number) {
  const cleanTitle = title.trim();
  const stepCount = Math.max(3, Math.min(7, Math.ceil(complexity / 1.5)));
  
  if (type === 'ADHD') {
    return [
      {
        step: `🌱 Set the Stage for "${cleanTitle}"`,
        time: 5,
        tip: "Gather ONLY the essentials. Turn off your notifications completely and fetch a cup of water.",
        reward: "Stretch up tall like a tree for 20 seconds!"
      },
      {
        step: "⚡ Draft the Absolute Simplest Version",
        time: 10,
        tip: "Write or draft without editing yourself. Perfectionism is a speed-trap—just put anything down first!",
        reward: "Doodle a smiley face in the margins!"
      },
      {
        step: "🧭 Core Action Focus Block",
        time: 15,
        tip: "Focus exclusively on one aspect of your task. Set a timer and let yourself get lost in the flow state.",
        reward: "Do a 30-second celebratory shoulder dance!"
      },
      {
        step: "🏁 Cross the Finish Line",
        time: 10,
        tip: "Review what you accomplished and tidy up. Do not over-polish; done is better than perfect!",
        reward: "Treat yourself to a healthy snack!"
      }
    ].slice(0, stepCount);
  }

  if (type === 'AUTISM') {
    return [
      {
        step: "📋 Gather Specific Assets",
        time: 5,
        tip: "Formulate a list of physical items or open tabs needed. Set them in a structured line on your workspace.",
        reward: "Enjoy the visual symmetry of your tidy environment."
      },
      {
        step: "🧱 Define System Boundaries",
        time: 15,
        tip: "Explicitly clarify what you will write/do first. Write down an objective start and stop goal.",
        reward: "Check this step off with a firm, solid checkmark."
      },
      {
        step: "🛠️ Process Implementation",
        time: 20,
        tip: "Execute strictly within the boundaries you set. Avoid answering emails or checking other tasks.",
        reward: "Pace around the room for 2 minutes to release tension."
      },
      {
        step: "📂 Verify & Catalog",
        time: 10,
        tip: "Ensure all requirements match your checklist criteria. Close tabs that are no longer requested.",
        reward: "Stretch gently and look at your completed work structure."
      }
    ].slice(0, stepCount);
  }

  if (type === 'DYSLEXIA') {
    return [
      {
        step: "🎨 Visual Mind Map",
        time: 10,
        tip: "Sketch out a quick grid, visual chart, or record a audio memo planning your ideas.",
        reward: "Look at your color-coded layout."
      },
      {
        step: "🗣️ Voice-to-Text Draft",
        time: 15,
        tip: "Dictate your main concepts out loud or use short fragments of words. Don't worry about spellings now.",
        reward: "Close your eyes or take a quick drink of cool water."
      },
      {
        step: "🔍 Spatial Organization",
        time: 15,
        tip: "Organize your dictated points into blocks. Use high contrast cards and dynamic icons to group ideas.",
        reward: "Take a deep, slow breath out."
      },
      {
        step: "🎧 Audio Review",
        time: 10,
        tip: "Listen to what you've compiled, or review it using spacious text spacing to quickly absorb the elements.",
        reward: "Celebrate creating a custom graphic mapping!"
      }
    ].slice(0, stepCount);
  }

  if (type === 'ANXIETY') {
    return [
      {
        step: "🌸 Grounding Gentle Start",
        time: 5,
        tip: "Inhale slowly for four seconds, hold for four, exhale. You are safe. There is zero time pressure here.",
        reward: "Smile and release your jaw muscles."
      },
      {
        step: "✍️ Write a 'Zero Draft'",
        time: 15,
        tip: "Make an incredibly rough draft that no one but you will ever see. It does not have to be good; it just has to exist.",
        reward: "Acknowledge yourself for showing up and starting."
      },
      {
        step: "🧩 Soft Progress Milestones",
        time: 10,
        tip: "Check in on your drafting. If you feel overwhelmed, it is 100% fine to step away for a bit and return.",
        reward: "Wrap your arms around yourself in a supportive hug."
      },
      {
        step: "🌟 Compassionate Validation",
        time: 10,
        tip: "Tweak your compile. Remind yourself: progress is incremental. Your worth is not tied to your productivity.",
        reward: "Listen to a calm sound or rest your eyes."
      }
    ].slice(0, stepCount);
  }

  // General fallbacks
  return [
    {
      step: "Preparation & Framing",
      time: 10,
      tip: "Define your clear target goals and locate any instructions or resources required to complete them.",
      reward: "Take a quick sip of water."
    },
    {
      step: "Initial Action Steps",
      time: 15,
      tip: "Commit to focused work for 15 minutes. Avoid interruptions or clicking outside your prompt boundaries.",
      reward: "Check this block off."
    },
    {
      step: "Finalization & Polishing",
      time: 15,
      tip: "Assemble your sub-tasks together, double check everything, and compile the final deliverable.",
      reward: "Sit back and appreciate your execution!"
    }
  ].slice(0, stepCount);
}
