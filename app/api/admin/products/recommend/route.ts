import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { title, description, category, availableProducts } = await request.json()

        if (!availableProducts || availableProducts.length === 0) {
            return NextResponse.json({ recommendedIds: [] })
        }

        const systemPrompt = `You are an expert visual merchandiser for an Egyptian cosmetics store.
Your goal is to select the best 3 cross-sell products from the provided inventory for a NEW product being added.

NEW PRODUCT:
Title: ${title}
Category: ${category}
Description: ${description}

INVENTORY:
${JSON.stringify(availableProducts.map((p: any) => ({ id: p.id, title: p.title })))}

INSTRUCTIONS:
1. Analyze the New Product and find complementary items in Inventory (e.g. Shampoo -> Conditioner).
2. Select up to 3 product IDs.
3. Return ONLY a raw JSON array of strings. Example: ["id1", "id2"]
4. If no good matches, return empty array [].
5. Do not output markdown code blocks.`

        let recommendedIds: string[] = []

        // Try Google First
        if (process.env.GOOGLE_API_KEY) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: { response_mime_type: "application/json" }
                    })
                })

                if (res.ok) {
                    const data = await res.json()
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
                    if (text) recommendedIds = JSON.parse(text)
                }
            } catch (e) {
                console.error("Google Recommend Failed", e)
            }
        }

        // Fallback to OpenRouter if Google failed or no key (and no results yet)
        if (recommendedIds.length === 0) {
            try {
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
                        messages: [{ role: "user", content: systemPrompt }]
                    })
                })

                if (res.ok) {
                    const data = await res.json()
                    let content = data.choices?.[0]?.message?.content
                    // Clean up potential markdown
                    content = content.replace(/```json/g, '').replace(/```/g, '').trim()
                    recommendedIds = JSON.parse(content)
                }
            } catch (e) {
                console.error("OpenRouter Recommend Failed", e)
            }
        }

        return NextResponse.json({ recommendedIds })

    } catch (error: any) {
        console.error('Recommendation Error:', error)
        return NextResponse.json({ recommendedIds: [] }, { status: 500 })
    }
}
