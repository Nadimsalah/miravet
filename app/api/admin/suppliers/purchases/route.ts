import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/suppliers/purchases (Add a new purchase)
export async function POST(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { 
            supplier_id, 
            product_id, 
            quantity, 
            purchase_price, 
            bl_number, 
            invoice_number, 
            payment_method, 
            payment_modality, 
            notes,
            profit_margin_percentage,
            price
        } = body

        if (!supplier_id || !product_id || !quantity || !purchase_price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Record the purchase
        const { data, error: pError } = await supabaseAdmin
            .from('supplier_purchases')
            .insert({
                supplier_id,
                product_id,
                quantity,
                purchase_price,
                bl_number,
                invoice_number,
                payment_method,
                payment_modality,
                notes
            })
            .select()
            .single()
        
        if (pError) throw pError

        // 2. Update product stock AND prices
        // Try calling the RPC first (bypassing RLS with admin client)
        const { error: stockError } = await supabaseAdmin.rpc('increment_stock', {
            x: quantity,
            row_id: product_id
        });

        // 3. Update master product info (Prices)
        const productUpdates: any = {
            purchase_price: purchase_price,
            updated_at: new Date().toISOString()
        }
        if (profit_margin_percentage !== undefined) productUpdates.profit_margin_percentage = profit_margin_percentage;
        if (price !== undefined) productUpdates.price = price;

        // Use a single update for stock if RPC failed, OR for prices only if RPC worked
        if (stockError) {
            console.warn('increment_stock RPC failed via admin, using manual update');
            const { data: currentProduct } = await supabaseAdmin
                .from('products')
                .select('stock')
                .eq('id', product_id)
                .single();
            
            productUpdates.stock = (currentProduct?.stock || 0) + quantity;
        }

        const { error: productUpdateError } = await supabaseAdmin
            .from('products')
            .update(productUpdates)
            .eq('id', product_id);

        if (productUpdateError) {
            console.error("Warning: Purchase recorded but product price update failed:", productUpdateError.message)
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error("API Error adding purchase:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
