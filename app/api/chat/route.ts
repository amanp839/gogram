import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1800) : "";
    if (!message) return NextResponse.json({ reply: "Ask me about a Wayanad trip, stay, trek or camping." }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: "I'm GoGram's preview assistant. I can help you compare stays, plan a weekend, or prepare questions about trekking and camping. Sample prices and availability are not confirmed—please contact GoGram on WhatsApp before making plans." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: "You are GoGram's travel assistant for Wayanad, Kerala. Be warm, concise and practical. Help visitors plan stays, trekking, camping and short itineraries. Treat sample listing prices as unverified. Never claim live availability, permits, weather safety, trail access or booking confirmation. Recommend checking local guidance, permissions and weather for outdoor activities. Do not invent GoGram policies; invite visitors to enquire on WhatsApp.",
      input: message
    });
    return NextResponse.json({ reply: response.output_text || "Please contact GoGram for help with that request." });
  } catch (error) {
    console.error("GoGram chat error:", error);
    return NextResponse.json({ reply: "The trip assistant is unavailable right now. Please contact GoGram on WhatsApp." }, { status: 500 });
  }
}
