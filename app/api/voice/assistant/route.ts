import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'nodejs';

/**
 * VOICE ASSISTANT BACKEND
 * STT -> LLM -> TTS pipeline
 */
export async function POST(req: NextRequest) {
    try {
        console.log('[Voice] Request received');

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey.includes('xxxx')) {
            console.error('[Voice] Error: OPENAI_API_KEY is missing or invalid.');
            return NextResponse.json({ error: 'OpenAI API Key is not set. Please update .env.local' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const formData = await req.formData();
        const audioBlob = formData.get('audio') as Blob;
        const language = (formData.get('language') as string) || 'ar';

        if (!audioBlob) {
            console.warn('[Voice] Warning: No audio blob in request');
            return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
        }

        console.log(`[Voice] Processing audio (${audioBlob.size} bytes, type: ${audioBlob.type})`);

        // 1. SPEECH-TO-TEXT (OpenAI Whisper)
        let contentType = audioBlob.type || 'audio/webm';

        // Normalize common browser mime types for OpenAI Whisper
        let extension = 'webm';
        if (contentType.includes('webm')) extension = 'webm';
        else if (contentType.includes('ogg')) extension = 'ogg';
        else if (contentType.includes('mpeg') || contentType.includes('mp3')) {
            extension = 'mp3';
            contentType = 'audio/mpeg';
        }
        else if (contentType.includes('wav')) extension = 'wav';
        else if (contentType.includes('mp4')) extension = 'mp4';
        else if (contentType.includes('m4a')) extension = 'm4a';

        console.log(`[Voice] Sending to Whisper: type=${contentType}, ext=${extension}`);
        const audioFile = new File([audioBlob], `input.${extension}`, { type: contentType });

        console.log('[Voice] Calling OpenAI Whisper API...');
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
        });

        const userText = transcription.text;
        console.log('[Voice] Whisper Transcribed:', userText);

        if (!userText || userText.trim().length < 2) {
            console.warn('[Voice] No clear transcription.');
            return NextResponse.json({ error: "I didn't hear you clearly. Please hold the button and speak again." }, { status: 400 });
        }

        // 2. FETCH STORE CONTEXT
        let products = null;
        try {
            if (supabaseAdmin) {
                console.log('[Voice] Fetching products context...');
                const { data, error } = await supabaseAdmin
                    .from('products')
                    .select('title, title_ar, price, stock, sku')
                    .eq('status', 'active')
                    .limit(8);

                if (error) console.error('[Voice] Supabase Context Error:', error);
                products = data;
            }
        } catch (dbErr) {
            console.error('[Voice] Database exception:', dbErr);
        }

        const storeContext = products?.map(p =>
            `- ${p.title} (${p.title_ar}): ${p.price} DZD / ${p.stock > 0 ? 'Disponible' : 'Rupture'}`
        ).join('\n') || "No product information available right now.";

        // 3. GENERATE AGENT RESPONSE
        console.log('[Voice] Sending to GPT-4o-mini...');
        const systemPrompt = `
      You are Nova, the Didali Store AI Voice Assistant.
      Greet warmly. Assist with product inquiries. 
      Keep it brief and conversational (max 2-3 sentences).
      Language: ${language === 'ar' ? 'Arabic (Algerian/Darija/MSA)' : 'French/English'}.
      Context current products:\n${storeContext}
    `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userText },
            ],
            max_tokens: 150,
        });

        const aiText = completion.choices[0].message.content || "I didn't quite catch that.";
        console.log('[Voice] GPT Response:', aiText);

        // 4. TEXT-TO-SPEECH
        console.log('[Voice] Generating TTS audio...');
        const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'nova',
            input: aiText,
            response_format: 'mp3',
        });

        const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
        console.log(`[Voice] Done. Audio ready (${audioBuffer.length} bytes)`);

        // 5. RESPOND
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'X-AI-Text': encodeURIComponent(aiText),
                'X-User-Text': encodeURIComponent(userText),
            },
        });

    } catch (error: any) {
        console.error('[Voice] CRITICAL ERROR:', error);
        return NextResponse.json({
            error: error.message || 'An unexpected error occurred',
            details: error.code || error.type
        }, { status: 500 });
    }
}
