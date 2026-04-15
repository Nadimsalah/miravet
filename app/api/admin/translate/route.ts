import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { text, targetLang = 'ar' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            // Mock response if no key (dev mode fallback)
            return NextResponse.json({
                translatedText: `[${targetLang}] ${text}`
            });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Translate the following category name from English to Egyptian Arabic. return ONLY the translation. Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();

        return NextResponse.json({ translatedText });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
