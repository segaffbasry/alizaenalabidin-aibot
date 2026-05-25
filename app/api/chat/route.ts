import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { data: knowledgeEntries } = await supabase
      .from("knowledge_base")
      .select("title, content");

    const knowledgeContext = knowledgeEntries?.length
      ? knowledgeEntries.map((e: { title: string; content: string }) => `**${e.title}**\n${e.content}`).join("\n\n")
      : "(Belum ada konteks pengetahuan yang ditambahkan)";

    const systemPrompt = `Kamu adalah AI Ali — representasi digital dari Ali Zaenal Abidin, seorang penulis, motivator, dan pemikir Indonesia.
Jawablah setiap pertanyaan dengan gaya, nilai, dan wawasan Ali.
Gunakan bahasa Indonesia yang hangat, bijaksana, dan inspiratif.
Berikut adalah konteks dan pengetahuan tentang Ali:

${knowledgeContext}`;

    let convId = conversationId;
    if (!convId) {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: message.substring(0, 50) })
        .select()
        .single();
      if (convError) throw convError;
      convId = conv.id;
    }

    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = (history || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.8,
    });

    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        }
        controller.close();

        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: fullResponse,
        });

        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": convId,
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
