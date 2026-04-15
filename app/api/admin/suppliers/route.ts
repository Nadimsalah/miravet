import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/suppliers (Fetch all or single supplier with metrics)
export async function GET(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            // Fetch single supplier details
            const { data: supplier, error: sError } = await supabaseAdmin
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single()

            if (sError) throw sError

            // Fetch purchases with product details
            const { data: purchases, error: pError } = await supabaseAdmin
                .from('supplier_purchases')
                .select('*, product:products(title, images)')
                .eq('supplier_id', id)
                .order('created_at', { ascending: false })

            if (pError) throw pError

            // Calculate Metrics
            const totalPurchased = (purchases || []).reduce((sum, p) => sum + p.quantity, 0)
            const totalSpent = (purchases || []).reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0)
            
            const productIds = [...new Set((purchases || []).map(p => p.product_id))]
            const VALID_STATUSES = ['processing', 'shipped', 'delivered']
            const { data: allSales } = await supabaseAdmin
                .from('order_items')
                .select('product_id, quantity, orders!inner(status)')
                .in('product_id', productIds)
                .in('orders.status', VALID_STATUSES)

            const totalSoldCount = (allSales || []).reduce((sum, s) => sum + s.quantity, 0)
            const currentStockCount = Math.max(0, totalPurchased - totalSoldCount)

            // Group by product for the profile view
            const productMap: Record<string, any> = {}
            purchases?.forEach(p => {
                if (!productMap[p.product_id]) {
                    productMap[p.product_id] = {
                        id: p.product_id,
                        title: p.product?.title || 'Unknown Product',
                        image: p.product?.images?.[0] || null,
                        purchasePrice: p.purchase_price,
                        totalPurchased: 0,
                        totalSpent: 0,
                        totalSold: 0,
                        currentStock: 0
                    }
                }
                productMap[p.product_id].totalPurchased += p.quantity
                productMap[p.product_id].totalSpent += (p.quantity * p.purchase_price)
                productMap[p.product_id].purchasePrice = p.purchase_price
            })

            allSales?.forEach(s => {
                if (productMap[s.product_id]) {
                    productMap[s.product_id].totalSold += s.quantity
                    productMap[s.product_id].currentStock = Math.max(0, productMap[s.product_id].totalPurchased - productMap[s.product_id].totalSold)
                }
            })

            return NextResponse.json({
                supplier,
                purchases: purchases || [],
                metrics: {
                    totalPurchased,
                    totalSpent,
                    totalSold: totalSoldCount,
                    currentStock: currentStockCount,
                    products: Object.values(productMap).sort((a, b) => b.totalPurchased - a.totalPurchased)
                }
            })
        }

        // Default: Fetch all suppliers (kept existing logic)
        const { data: suppliersData, error: suppliersError } = await supabaseAdmin
            .from('suppliers')
            .select('*')
            .order('created_at', { ascending: false })

        if (suppliersError) throw suppliersError

        const { data: purchasesData } = await supabaseAdmin
            .from('supplier_purchases')
            .select('supplier_id, quantity, purchase_price, product_id');
        
        const productIds = [...new Set(purchasesData?.map(p => p.supplier_id) || [])];
        const { data: allSales } = await supabaseAdmin
            .from('order_items')
            .select('product_id, quantity, orders!inner(status)')
            .in('orders.status', ['processing', 'shipped', 'delivered']);

        const salesByProduct: Record<string, number> = {};
        allSales?.forEach(s => {
            salesByProduct[s.product_id] = (salesByProduct[s.product_id] || 0) + s.quantity;
        });

        const suppliersWithMetrics = (suppliersData || []).map(s => {
            const supplierPurchases = (purchasesData || []).filter(p => p.supplier_id === s.id);
            const spent = supplierPurchases.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0);
            const purchasedItems = supplierPurchases.reduce((sum, p) => sum + p.quantity, 0);
            const supplierProductIds = [...new Set(supplierPurchases.map(p => p.product_id))];
            const soldItems = supplierProductIds.reduce((sum, pid) => sum + (salesByProduct[pid] || 0), 0);

            return { 
                ...s, 
                totalSpent: spent, 
                totalItems: purchasedItems, 
                totalProducts: supplierProductIds.length,
                currentStock: Math.max(0, purchasedItems - soldItems)
            };
        });

        return NextResponse.json({ suppliers: suppliersWithMetrics })
    } catch (error: any) {
        console.error("API Error fetching supplier(s):", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/admin/suppliers (Add new supplier)
export async function POST(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { name, contact_name, email, phone, address, notes } = body

        if (!name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('suppliers')
            .insert([{ name, contact_name, email, phone, address, notes }])
            .select()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error("API Error adding supplier:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/admin/suppliers (Update supplier)
export async function PATCH(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { id, name, contact_name, email, phone, address, notes } = body

        if (!id || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('suppliers')
            .update({ name, contact_name, email, phone, address, notes })
            .eq('id', id)
            .select()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error("API Error updating supplier:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/admin/suppliers (Delete supplier)
export async function DELETE(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "Missing supplier ID" }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('suppliers')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("API Error deleting supplier:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
