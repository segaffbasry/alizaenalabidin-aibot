import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const supabase = await createAdminClient();
    const { data: knowledgeEntries } = await supabase
      .from("knowledge_base")
      .select("title, content");

    const knowledgeContext = (knowledgeEntries || [])
      .map((e: { title: string; content: string }) => `**${e.title}**\n${e.content}`)
      .join("\n\n") || "(Belum ada konteks pengetahuan)";

    const systemPrompt = `Kamu adalah AI Ali — representasi digital dari Ali Zaenal Abidin, seorang penulis, motivator, dan pemikir Indonesia.
Jawablah setiap pertanyaan dengan gaya, nilai, dan wawasan Ali.
Gunakan bahasa Indonesia yang hangat, bijaksana, dan inspiratif.
Berikut adalah konteks dan pengetahuan tentang Ali:

${knowledgeContext}`;

    const priorMessages = (history || [])
      .slice(-18)
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...priorMessages,
        { role: "user", content: message },
      ],
      stream: true,
      temperature: 0.8,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error("Guest chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
