import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { text } = await request.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        const systemPrompt = `You are a professional copywriter for a high-end cosmetics brand in Egypt.
Your task is to take a rough input about product benefits and generate exactly 4 distinct, short, punchy benefit titles in EGYPTIAN ARABIC (Masri).
Language: Egyptian Arabic (Masri).
Output Requirements:
- Return ONLY a raw JSON array of strings.
- Example: ["ترطيب عميق", "مكونات طبيعية", "امتصاص سريع", "مكافحة الشيخوخة"]
- Do NOT include any markdown formatting or code blocks.
- Do NOT include any explanation.
- Generate exactly 4 benefits.
- Each title must be 2-4 words max.
- Use attractive, marketing-friendly Egyptian dialect.`

        let benefits: string[] = []
        // If no API keys are configured, return mock benefits immediately
        if (!process.env.GOOGLE_API_KEY && !process.env.OPENROUTER_API_KEY) {
            return NextResponse.json({
                benefits: ["ترطيب عميق", "مكونات طبيعية 100%", "خالي من المواد الضارة", "نتائج سريعة"],
                source: "mock_fallback"
            })
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nInput: "${text}"` }] }],
                    generationConfig: { response_mime_type: "application/json" }
                }),
                signal: controller.signal
            }).finally(() => clearTimeout(timeoutId))

            if (res.ok) {
                const data = await res.json()
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text
                if (content) {
                    try {
                        benefits = JSON.parse(content)
                    } catch (e) {
                        console.error("Failed to parse Google JSON", e)
                    }
                }
            }
        } catch (e) {
            console.error("Google Generate Benefits Failed", e)
        }


        // Fallback to OpenRouter
        if (!benefits || benefits.length === 0) {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000)

                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://localhost:3000",
                        "X-Title": "E-commerce Admin"
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.0-flash-exp:free",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: `Input: "${text}"` }
                        ]
                    }),
                    signal: controller.signal
                }).finally(() => clearTimeout(timeoutId))

                if (res.ok) {
                    const data = await res.json()
                    let content = data.choices?.[0]?.message?.content
                    // robust cleanup
                    if (content) {
                        content = content.replace(/```json/g, '').replace(/```/g, '').trim()
                        // Find array bracket content, supporting newlines
                        const jsonMatch = content.match(/\[[\s\S]*\]/)
                        if (jsonMatch) {
                            content = jsonMatch[0]
                        }
                        try {
                            benefits = JSON.parse(content)
                        } catch (e) {
                            console.error("Failed to parse OpenRouter JSON", e)
                        }
                    }
                }
            } catch (e) {
                console.error("OpenRouter Generate Benefits Failed", e)
            }
        }

        // If no benefits were generated, return mock fallback
        if (!benefits || benefits.length === 0) {
            return NextResponse.json({
                benefits: ["ترطيب عميق", "مكونات طبيعية 100%", "خالي من المواد الضارة", "نتائج سريعة"],
                source: "mock_fallback"
            })
        }
        return NextResponse.json({ benefits });

    } catch (error: any) {
        console.error('Generate Benefits Error:', error)
        return NextResponse.json({
            benefits: ["ترطيب عميق فوري", "مكونات طبيعية ١٠٠٪", "خالي من المواد الضارة", "نتائج فعالة وسريعة"],
            source: "mock_fallback"
        });
    }
}
