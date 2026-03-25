import { supabase, supabaseAdmin } from './supabase'


export interface Product {
    id: string
    title: string
    title_ar: string | null
    description: string | null
    description_ar: string | null
    sku: string
    category: string
    price: number
    reseller_price?: number | null
    partner_price?: number | null
    wholesaler_price?: number | null
    reseller_min_qty?: number | null
    partner_min_qty?: number | null
    wholesaler_min_qty?: number | null
    compare_at_price: number | null
    stock: number
    status: string
    images: string[]
    benefits: string[] | null
    benefits_ar: string[] | null
    ingredients: string | null
    ingredients_ar: string | null
    how_to_use: string | null
    how_to_use_ar: string | null
    sales_count: number
    warehouse_id: string | null
    supplier_id: string | null
    purchase_price: number | null
    profit_margin_percentage: number | null
    created_at: string
    updated_at: string
}

export interface Customer {
    id: string
    name: string
    email: string
    phone: string | null
    role: string // 'customer' | 'reseller' | 'admin'
    company_name?: string | null
    ice?: string | null
    website?: string | null
    city?: string | null
    status: string
    total_orders: number
    total_spent: number
    created_at: string
    updated_at: string
}

export interface Order {
    id: string
    order_number: string
    customer_id: string | null
    customer_name: string
    customer_email: string
    customer_phone: string
    address_line1: string
    address_line2: string | null
    city: string
    governorate: string
    postal_code: string | null
    status: string
    subtotal: number
    shipping_cost: number
    total: number
    payment_method: string | null
    ip_address: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface OrderItem {
    id: string
    order_id: string
    product_id: string | null
    product_title: string
    product_sku: string
    product_image: string | null
    variant_name: string | null
    quantity: number
    price: number
    subtotal: number
    created_at: string
}

// WhatsApp subscriptions
export interface WhatsappSubscription {
    id: string
    country_code: string
    phone: string
    created_at: string
}

// Contact messages
export interface ContactMessage {
    id: string
    name: string
    email: string | null
    phone: string
    company: string | null
    type: string | null
    message: string
    created_at: string
}

export interface ShippingSetting {
    id: string
    role: 'retail' | 'reseller'
    base_price: number
    free_shipping_threshold: number
    free_shipping_min_items: number
    enabled: boolean
    updated_at: string
}

// Career applications
export interface CareerApplication {
    id: string
    name: string
    email: string
    phone: string
    role: string
    cv_file_name: string | null
    summary: string
    created_at: string
}

export async function createWhatsappSubscription(input: {
    countryCode: string
    phone: string
}): Promise<{ data?: WhatsappSubscription; error?: string }> {
    const { data, error } = await supabase
        .from('whatsapp_subscriptions')
        .insert({
            country_code: input.countryCode,
            phone: input.phone,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating WhatsApp subscription:', error.message)
        return { error: error.message }
    }

    return { data: data as WhatsappSubscription }
}

export async function listWhatsappSubscriptions(): Promise<WhatsappSubscription[]> {
    const { data, error } = await supabase
        .from('whatsapp_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading WhatsApp subscriptions:', error.message)
        return []
    }

    return (data || []) as WhatsappSubscription[]
}

export async function createContactMessage(input: {
    name: string
    email?: string
    phone: string
    company?: string
    type?: string
    message: string
}): Promise<{ data?: ContactMessage; error?: string }> {
    const { data, error } = await supabase
        .from('contact_messages')
        .insert({
            name: input.name,
            email: input.email || null,
            phone: input.phone,
            company: input.company || null,
            type: input.type || null,
            message: input.message,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating contact message:', error.message)
        return { error: error.message }
    }

    return { data: data as ContactMessage }
}

export async function listContactMessages(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading contact messages:', error.message)
        return []
    }

    return (data || []) as ContactMessage[]
}

export async function createCareerApplication(input: {
    name: string
    email: string
    phone: string
    role: string
    summary: string
    cvFilePath: string | null
}): Promise<{ data?: CareerApplication; error?: string }> {
    const { data, error } = await supabase
        .from('career_applications')
        .insert({
            name: input.name,
            email: input.email,
            phone: input.phone,
            role: input.role,
            summary: input.summary,
            cv_file_name: input.cvFilePath,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating career application:', error.message)
        return { error: error.message }
    }

    return { data: data as CareerApplication }
}

export async function listCareerApplications(): Promise<CareerApplication[]> {
    const { data, error } = await supabase
        .from('career_applications')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading career applications:', error.message)
        return []
    }

    return (data || []) as CareerApplication[]
}

// --- SHIPPING SETTINGS ---

export async function getShippingSettings() {
    const { data, error } = await supabase
        .from('shipping_settings')
        .select('*')
        .order('role', { ascending: true })

    if (error) {
        console.error('Error fetching shipping settings:', error)
        return []
    }

    return data as ShippingSetting[]
}

export async function updateShippingSettings(settings: ShippingSetting[]) {
    try {
        for (const setting of settings) {
            const { error } = await supabase
                .from('shipping_settings')
                .update({
                    base_price: setting.base_price,
                    free_shipping_threshold: setting.free_shipping_threshold,
                    free_shipping_min_items: setting.free_shipping_min_items,
                    enabled: setting.enabled
                })
                .eq('id', setting.id)

            if (error) throw error
        }
        return { success: true }
    } catch (error) {
        console.error('Error updating shipping settings:', error)
        return { success: false, error }
    }
}

// Products API
export async function getProducts(filters?: {
    category?: string
    status?: string
    search?: string
    brand_id?: string
    brand_slug?: string
    supplier_id?: string
    limit?: number
    offset?: number
}) {
    let query = supabase
        .from('products')
        .select('*, brand:brands(*)')
        .order('created_at', { ascending: false })

    if (filters?.category) {
        // Use ilike to handle comma-separated categories in the text column
        query = query.ilike('category', `%${filters.category}%`)
    }

    if (filters?.supplier_id) {
        query = query.or(`supplier_id.eq.${filters.supplier_id},supplier_id.is.null`)
    }

    if (filters?.brand_id) {
        query = query.eq('brand_id', filters.brand_id)
    }

    if (filters?.brand_slug) {
        // Filter on the joined table using the alias or the table name
        query = query.eq('brand.slug', filters.brand_slug)
    }

    if (filters?.status) {
        query = query.eq('status', filters.status)
    } else if (!filters?.brand_id && !filters?.brand_slug) {
        // Default to active products only for main shop/search
        query = query.eq('status', 'active')
    }
    if (filters?.limit) {
        query = query.limit(filters.limit)
    }

    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    if (filters?.search) {
        const searchTerm = `%${filters.search}%`
        const mainOrQuery = `title.ilike."${searchTerm}",title_ar.ilike."${searchTerm}",description.ilike."${searchTerm}",description_ar.ilike."${searchTerm}"`

        const { data, error: searchError } = await query.or(mainOrQuery)

        if (searchError) {
            // If Arabic columns are missing, fallback to English only search
            if (searchError.message?.includes('column "title_ar" does not exist') ||
                searchError.message?.includes('column "description_ar" does not exist')) {
                console.warn('Bilingual columns missing, falling back to English search.')

                // Re-build clean query for fallback
                let fallbackQueryBuilder = supabase
                    .from('products')
                    .select('*, brand:brands(*)')
                    .order('created_at', { ascending: false })

                if (filters?.category) fallbackQueryBuilder = fallbackQueryBuilder.eq('category', filters.category)
                if (filters?.status) fallbackQueryBuilder = fallbackQueryBuilder.eq('status', filters.status)
                else fallbackQueryBuilder = fallbackQueryBuilder.eq('status', 'active')

                if (filters?.limit) fallbackQueryBuilder = fallbackQueryBuilder.limit(filters.limit)
                if (filters?.offset) fallbackQueryBuilder = fallbackQueryBuilder.range(filters.offset, filters.offset + (filters.limit || 10) - 1)

                if (filters?.brand_id) fallbackQueryBuilder = fallbackQueryBuilder.eq('brand_id', filters.brand_id)
                if (filters?.brand_slug) fallbackQueryBuilder = fallbackQueryBuilder.eq('brand.slug', filters.brand_slug)

                const { data: fbData, error: fbError } = await fallbackQueryBuilder.or(`title.ilike."${searchTerm}",description.ilike."${searchTerm}"`)

                if (fbError) {
                    console.error('Search failed even with fallback:', fbError.message)
                    return []
                }
                console.log(`Fallback search found ${fbData?.length} products`)
                return fbData as Product[]
            }

            console.error('Error fetching products:', searchError.message || searchError)
            return []
        }

        return data as Product[]
    }

    const { data, error } = await query

    if (error) {
        console.error('❌ Supabase Error (Products):', error.message || error, {
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return []
    }

    return data as Product[]
}



export async function getProductById(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            console.warn(`Product with ID ${id} not found`)
            return null
        }
        console.error(`Error fetching product ${id}:`, error)
        return null
    }

    return data as Product
}

export async function getProductBySku(sku: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single()

    if (error) {
        console.error('Error fetching product:', error)
        return null
    }

    return data as Product
}

export async function getRelatedProducts(productId: string, limit = 4) {
    const { data, error } = await supabase
        .from('product_cross_sells')
        .select(`
      related_product_id,
      products!product_cross_sells_related_product_id_fkey (*)
    `)
        .eq('product_id', productId)
        .limit(limit)

    if (error) {
        console.error('Error fetching related products:', error)
        return []
    }

    return (data.map(item => item.products) as unknown) as Product[]
}

// Orders API
export async function getOrders(filters?: {
    status?: string
    customer_id?: string
    guest_only?: boolean
    limit?: number
    offset?: number
    startDate?: Date | null
    endDate?: Date | null
}) {
    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (filters?.startDate) {
        // Create new date to avoid mutating
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        query = query.gte('created_at', start.toISOString());
    }

    if (filters?.endDate) {
        // Create new date to avoid mutating
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
    }

    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
    }

    if (filters?.guest_only) {
        query = query.is('customer_id', null)
    }

    if (filters?.limit) {
        query = query.limit(filters.limit)
    }

    if (filters?.offset) {
        query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching orders:', error.message || error);
        if (error.details) console.error('Details:', error.details);
        return { data: [], count: 0 }
    }

    return {
        data: data as Order[],
        count: count || 0
    }
}

export async function getCustomerOrders(identifier: string) {
    // Try to find if it's a reseller first
    const { data: resellerData } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', identifier)
        .maybeSingle()

    let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

    if (resellerData) {
        // If it's a reseller, filter by reseller_id AND customer_id (sometimes both are set)
        query = query.or(`customer_id.eq.${identifier},reseller_id.eq.${resellerData.id}`)
    } else {
        query = query.eq('customer_id', identifier)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching customer orders:', error)
        return []
    }

    return data as Order[]
}

export async function getOrderById(id: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*),
      reseller:resellers (*, profile:profiles(name))
    `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching order:', error)
        return null
    }

    return data as (Order & {
        order_items: OrderItem[],
        reseller?: {
            id: string,
            company_name: string,
            profile?: { name: string }
        }
    })
}

export async function createOrder(data: {
    customer: {
        name: string
        email: string
        phone: string
        address_line1: string
        city: string
    }
    items: {
        product_id: string
        product_title: string
        product_sku: string
        product_image: string | null
        quantity: number
        price: number
        subtotal: number
    }[]
    subtotal: number
    shipping_cost: number
    total: number
    payment_method: string
    customerId?: string
}) {
    // 1. Get or create customer
    let customer: any = null;

    if (data.customerId) {
        // If customerId is provided, get the customer record
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', data.customerId)
            .maybeSingle()

        customer = existingCustomer;
    }

    if (!customer) {
        // Fallback to email-based check (for guests or missing records)
        const normalizedEmail = data.customer.email.toLowerCase().trim();
        const { data: emailCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (emailCustomer) {
            customer = emailCustomer;
        } else {
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    name: data.customer.name,
                    email: normalizedEmail,
                    phone: data.customer.phone,
                    role: 'customer',
                    status: 'active',
                    total_orders: 0,
                    total_spent: 0
                })
                .select()
                .maybeSingle()

            if (customerError) {
                console.error('Error with customer record:', customerError)
            }
            customer = newCustomer;
        }
    }

    // 2. Insert order
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`

    // Check if customer is a reseller
    let resellerId = null
    if (customer?.id) {
        const { data: resellerData } = await supabase
            .from('resellers')
            .select('id')
            .eq('user_id', customer.id)
            .maybeSingle()
        if (resellerData) resellerId = resellerData.id
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            customer_id: customer?.id || null,
            reseller_id: resellerId,
            customer_name: data.customer.name,
            customer_email: data.customer.email,
            customer_phone: data.customer.phone,
            address_line1: data.customer.address_line1,
            city: data.customer.city,
            governorate: 'Morocco', // Default for now
            status: 'pending',
            subtotal: data.subtotal,
            shipping_cost: data.shipping_cost,
            total: data.total,
            payment_method: data.payment_method
        })
        .select()
        .single()

    if (orderError) {
        console.error('Error creating order:', orderError)
        return { error: orderError }
    }

    // 3. Insert order items
    const orderItems = data.items.map(item => ({
        order_id: order.id,
        ...item
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('Error creating order items:', itemsError)
        return { error: itemsError }
    }

    // 4. Update customer stats
    if (customer?.id) {
        // We do a direct update instead of RPC to be more reliable across environments
        const { data: currentStats } = await supabase
            .from('customers')
            .select('total_orders, total_spent')
            .eq('id', customer.id)
            .maybeSingle()

        if (currentStats) {
            await supabase
                .from('customers')
                .update({
                    total_orders: (currentStats.total_orders || 0) + 1,
                    total_spent: Number(currentStats.total_spent || 0) + data.total,
                    name: data.customer.name, // In case they used a different name this time
                    phone: data.customer.phone
                })
                .eq('id', customer.id)
        }
    }

    return { order }
}

export async function updateOrderStatus(orderId: string, status: string) {
    // USE ADMIN CLIENT to bypass RLS restrictions on triggers/logs
    // If supabaseAdmin is not available (client-side), fall back to standard supabase client
    const client = supabaseAdmin || supabase

    const { data, error } = await client
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        console.error('Error updating order status:', error.message || error)
        if (error.details) console.error('Error details:', error.details)
        if (error.hint) console.error('Error hint:', error.hint)
        return { error }
    }

    return { data }
}
export async function getCustomers(filters?: {
    status?: string
    role?: string
    limit?: number
    offset?: number
}) {
    let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    if (filters?.role) {
        if (filters.role === 'customer') {
            // Explicitly getting guests: Role is 'customer' OR NULL, AND NOT 'reseller' or 'admin' just to be safe
            query = query.or('role.eq.customer,role.is.null')
            query = query.neq('role', 'reseller')
            query = query.neq('role', 'admin')
        } else {
            query = query.eq('role', filters.role)
        }
    }

    if (filters?.limit) {
        query = query.limit(filters.limit)
    }

    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching customers:', error)
        return []
    }

    return data as Customer[]
}

export async function getCustomerById(id: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null // Silent return if not found
        console.error('Error fetching customer:', error)
        return null
    }

    return data as Customer
}

export async function updateCustomerStatus(customerId: string, status: string) {
    const { data, error } = await supabase
        .from('customers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .select()
        .single()

    if (error) {
        console.error('Error updating customer status:', error)
        return null
    }

    return data as Customer
}

export async function updateResellerStatus(id: string, status: string) {
    const { data, error } = await supabase
        .from('resellers')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        // Try fallback with user_id just in case
        const { data: retryData, error: retryError } = await supabase
            .from('resellers')
            .update({ status })
            .eq('user_id', id)
            .select()
            .single()

        if (retryError) {
            console.error('Error updating reseller status:', retryError)
            return null
        }
        return retryData
    }

    return data
}

export async function getCurrentUserRole(userId?: string): Promise<string | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) return null

    if (!userId) {
        userId = session.user.id
    }

    // First try profiles table (source of truth)
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (!error && data?.role) {
        return data.role as string
    }

    // Fallback to JWT user_metadata when profiles table has no record
    // (e.g. when trigger was broken and profile wasn't created yet)
    const metaRole = session.user.user_metadata?.role
    if (metaRole) {
        return metaRole as string
    }

    // Final fallback
    return 'customer'
}

export async function getResellerByUserId(userId: string) {
    const { data, error } = await supabase
        .from('resellers')
        .select(`
            *,
            profile:profiles(*)
        `)
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching reseller by userId:', error)
        return null
    }

    if (!data) return null

    // Transform for component compatibility
    return {
        ...data,
        name: data.profile?.name || 'Unknown',
        email: data.profile?.email || 'N/A',
        phone: data.profile?.phone || data.phone || null,
        role: data.profile?.role || 'reseller'
    } as any
}


export type ResellerTier = 'reseller' | 'partner' | 'wholesaler' | null

export async function getCurrentUserId(): Promise<string | null> {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session?.user) return null
    return session.user.id
}

export async function getUserRole(): Promise<string | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) return null

    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (error || !data) return null
    return data.role
}

export async function getCurrentResellerTier(userId?: string): Promise<ResellerTier> {
    if (!userId) {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session?.user) return null
        userId = session.user.id
    }

    const { data, error } = await supabase
        .from('customers')
        .select('role, reseller_type')
        .eq('id', userId)
        .single()

    if (error || !data) {
        return null
    }

    if (data.role !== 'reseller') {
        return null
    }

    return (data as any).reseller_type || 'reseller'
}

export async function getDashboardStats() {
    const VALID_STATUSES = ['processing', 'shipped', 'delivered']
    
    // Get total revenue (Only DELIVERED orders)
    const { data: orders } = await supabase
        .from('orders')
        .select('total, status')

    const totalRevenue = orders
        ?.filter(o => VALID_STATUSES.includes(o.status))
        .reduce((sum, order) => sum + order.total, 0) || 0

    const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0

    // Get total resellers from resellers table (source of truth for business)
    const { count: resellerCount } = await supabase
        .from('resellers')
        .select('*', { count: 'exact', head: true })

    // Get total customers (Guests)
    // We count unique emails from orders that are NOT linked to a reseller
    const { data: guestOrdersRaw } = await supabase
        .from('orders')
        .select('customer_email')
        .is('reseller_id', null)

    // Count unique emails
    const uniqueGuestEmails = new Set(guestOrdersRaw?.map(o => o.customer_email?.toLowerCase().trim()).filter(Boolean))
    const customerCount = uniqueGuestEmails.size

    // Get total products
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

    return {
        totalRevenue,
        totalOrders: orders?.filter(o => VALID_STATUSES.includes(o.status)).length || 0,
        completedOrders,
        pendingOrders,
        totalResellers: resellerCount || 0,
        totalCustomers: customerCount || 0,
        totalProducts: productCount || 0
    }
}

export async function getRevenueAnalytics() {
    const VALID_STATUSES = ['processing', 'shipped', 'delivered']
    const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .in('status', VALID_STATUSES)
        .order('created_at', { ascending: true })

    if (!orders) return []

    // Group by day
    const revenueByDay: Record<string, number> = {}
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' })
        revenueByDay[date] = (revenueByDay[date] || 0) + order.total
    })

    return Object.entries(revenueByDay).map(([name, revenue]) => ({ name, revenue }))
}

export async function getTopProducts(limit = 5) {
    const VALID_STATUSES = ['processing', 'shipped', 'delivered']
    const { data: items } = await supabase
        .from('order_items')
        .select('product_title, quantity, subtotal, orders!inner(status)')
        .in('orders.status', VALID_STATUSES)

    if (!items) return []

    // Group by product
    const products: Record<string, { sales: number, revenue: number }> = {}
    items.forEach(item => {
        if (!products[item.product_title]) {
            products[item.product_title] = { sales: 0, revenue: 0 }
        }
        products[item.product_title].sales += item.quantity
        products[item.product_title].revenue += item.subtotal
    })

    return Object.entries(products)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)
}

export async function getAdminSettings() {
    const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')

    if (error) {
        console.error('Error fetching admin settings:', error)
        return {}
    }

    const settings: Record<string, string> = {}
    if (data && Array.isArray(data)) {
        data.forEach(item => {
            if (item && item.key) {
                settings[item.key] = item.value || ""
            }
        })
    }

    return settings
}

export async function updateAdminSettings(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from('admin_settings')
        .upsert(updates, { onConflict: 'key' })

    if (error) {
        console.error('Error updating admin settings:', error)
        return { error }
    }

    return { success: true }
}

// ============================================================================
// Hero Carousel Management
// ============================================================================

export interface HeroCarouselItem {
    id: string
    position: number
    image_url: string
    title: string
    subtitle: string | null
    link: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

/**
 * Get all hero carousel items ordered by position
 */
export async function getHeroCarouselItems(admin = false): Promise<HeroCarouselItem[]> {
    let query = supabase
        .from('hero_carousel')
        .select('*')
        .order('position', { ascending: true })

    if (!admin) {
        query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching hero carousel items:', error)
        return []
    }

    return data || []
}

/**
 * Update a hero carousel item
 */
export async function updateHeroCarouselItem(
    id: string,
    updates: Partial<Pick<HeroCarouselItem, 'title' | 'subtitle' | 'image_url' | 'is_active' | 'link' | 'position'>>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('hero_carousel')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Error updating hero carousel item:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Add a new hero carousel item
 */
export async function addHeroCarouselItem(item: {
    title: string;
    subtitle?: string;
    image_url: string;
    link?: string;
    position: number;
    is_active?: boolean;
}): Promise<{ success: boolean; data?: HeroCarouselItem; error?: string }> {
    const { data, error } = await supabase
        .from('hero_carousel')
        .insert({
            ...item,
            is_active: item.is_active ?? true
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding hero carousel item:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: data as HeroCarouselItem }
}

/**
 * Delete a hero carousel item
 */
export async function deleteHeroCarouselItem(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('hero_carousel')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting hero carousel item:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Upload hero carousel image to Supabase Storage
 */
export async function uploadHeroCarouselImage(
    file: File,
    position: number
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `hero-carousel-${position}-${Date.now()}.${fileExt}`
        const filePath = `hero-carousel/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            console.error('Error uploading image:', uploadError)
            return { success: false, error: uploadError.message }
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

        return { success: true, url: publicUrl }
    } catch (error) {
        console.error('Error in uploadHeroCarouselImage:', error)
        return { success: false, error: 'Failed to upload image' }
    }
}

/**
 * Reorder hero carousel items
 */
export async function reorderHeroCarousel(
    items: Array<{ id: string; position: number }>
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update each item's position
        const updates = items.map(item =>
            supabase
                .from('hero_carousel')
                .update({ position: item.position })
                .eq('id', item.id)
        )

        const results = await Promise.all(updates)
        const hasError = results.some(result => result.error)

        if (hasError) {
            return { success: false, error: 'Failed to reorder some items' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error reordering carousel:', error)
        return { success: false, error: 'Failed to reorder carousel' }
    }
}

export async function getCategories(filters?: { onlyMain?: boolean, parentId?: string }) {
    let query = supabase
        .from('categories')
        .select('*')
        .order('name')

    if (filters?.onlyMain) {
        query = query.is('parent_id', null)
    }

    if (filters?.parentId) {
        query = query.eq('parent_id', filters.parentId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching categories:', error.message)
        return []
    }

    return data as { id: string, name: string, slug: string, name_ar?: string, parent_id?: string | null }[]
}

export async function getCategoryBySlug(slug: string) {
    // We include children in the select to allow sub-category navigation
    const { data, error } = await supabase
        .from('categories')
        .select('*, children:categories!parent_id(*)')
        .eq('slug', slug)
        .maybeSingle()

    if (error) {
        console.error('Error fetching category by slug:', error.message)
        return null
    }

    return data as { 
        id: string, 
        name: string, 
        slug: string, 
        name_ar?: string, 
        parent_id?: string | null,
        children?: any[]
    } | null
}

export async function getAdvancedAnalytics() {
    // 1. Top Clients (Guests)
    // We count unique emails from orders that are NOT linked to a reseller
    const { data: guestOrders } = await supabase
        .from('orders')
        .select('customer_email, customer_name, total')
        .is('reseller_id', null)
        .order('created_at', { ascending: false })

    const clientStats = new Map<string, { email: string, name: string, totalSpent: number, ordersCount: number }>();
    if (guestOrders) {
        guestOrders.forEach(order => {
            const email = order.customer_email?.toLowerCase().trim();
            if (!email) return;

            if (!clientStats.has(email)) {
                clientStats.set(email, { email, name: order.customer_name, totalSpent: 0, ordersCount: 0 });
            }
            const stat = clientStats.get(email)!;
            stat.totalSpent += order.total;
            stat.ordersCount += 1;
        });
    }
    const topClients = Array.from(clientStats.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

    // 2. Top Resellers
    const { data: resellerOrders } = await supabase
        .from('orders')
        .select('reseller_id, total, reseller:resellers(company_name, user_id, profile:profiles(name))')
        .not('reseller_id', 'is', null)

    const resellerStats = new Map<string, { id: string, name: string, totalSpent: number, ordersCount: number }>();
    if (resellerOrders) {
        resellerOrders.forEach(order => {
            const resellerId = order.reseller_id;
            // @ts-ignore
            const companyName = order.reseller?.company_name || order.reseller?.profile?.name || 'Unknown Reseller';

            if (!resellerStats.has(resellerId)) {
                resellerStats.set(resellerId, { id: resellerId, name: companyName, totalSpent: 0, ordersCount: 0 });
            }
            const stat = resellerStats.get(resellerId)!;
            stat.totalSpent += order.total;
            stat.ordersCount += 1;
        });
    }
    const topResellers = Array.from(resellerStats.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

    // 3. Low Stock Products
    const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, title, stock, price, images')
        .lt('stock', 10)
        .order('stock', { ascending: true })
        .limit(5);

    // 4. Low Sales Products
    const { data: lowSalesProducts } = await supabase
        .from('products')
        .select('id, title, sales_count, price, images')
        .order('sales_count', { ascending: true })
        .limit(5);

    // 5. Account Managers
    // Get count of profiles where role is admin
    const { count: accountManagerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

    return {
        topClients,
        topResellers,
        lowStockProducts: lowStockProducts || [],
        lowSalesProducts: lowSalesProducts || [],
        accountManagerCount: accountManagerCount || 0
    };
}

export interface Supplier {
    id: string;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    created_at: string;
}

export interface SupplierPurchase {
    id: string;
    supplier_id: string;
    product_id: string;
    quantity: number;
    purchase_price: number;
    bl_number: string | null;
    invoice_number: string | null;
    payment_method: 'cash' | 'cheque' | 'card' | 'transfer' | null;
    payment_modality: string | null;
    notes: string | null;
    created_at: string;
    product?: {
        title: string;
        images: string[];
    };
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching supplier:', error.message);
        return null;
    }
    return data as Supplier;
}

export async function getSupplierPurchases(supplierId: string): Promise<SupplierPurchase[]> {
    const { data, error } = await supabase
        .from('supplier_purchases')
        .select('*, product:products(title, images)')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching purchases:', error.message);
        return [];
    }
    return data as SupplierPurchase[];
}

export async function createSupplierPurchase(purchase: {
    supplier_id: string;
    product_id: string;
    quantity: number;
    purchase_price: number;
    bl_number?: string;
    invoice_number?: string;
    payment_method?: 'cash' | 'cheque' | 'card' | 'transfer';
    payment_modality?: string;
    notes?: string;
    profit_margin_percentage?: number;
    price?: number;
}) {
    // 1. Record the purchase
    const { data, error } = await supabase
        .from('supplier_purchases')
        .insert({
            supplier_id: purchase.supplier_id,
            product_id: purchase.product_id,
            quantity: purchase.quantity,
            purchase_price: purchase.purchase_price,
            bl_number: purchase.bl_number,
            invoice_number: purchase.invoice_number,
            payment_method: purchase.payment_method,
            payment_modality: purchase.payment_modality,
            notes: purchase.notes
        })
        .select()
        .single();
    
    if (error) throw error;

    // 2. Update product stock AND prices
    const { error: stockError } = await supabase.rpc('increment_stock', {
        x: purchase.quantity,
        row_id: purchase.product_id
    });

    // 3. Update master product info (Prices)
    const productUpdates: any = {
        purchase_price: purchase.purchase_price
    }
    if (purchase.profit_margin_percentage !== undefined) productUpdates.profit_margin_percentage = purchase.profit_margin_percentage;
    if (purchase.price !== undefined) productUpdates.price = purchase.price;

    // Use a single update for stock if RPC failed, OR for prices only if RPC worked
    if (stockError) {
        console.warn('increment_stock RPC failed, using manual update');
        const { data: currentProduct } = await supabase
            .from('products')
            .select('stock')
            .eq('id', purchase.product_id)
            .single();
        
        productUpdates.stock = (currentProduct?.stock || 0) + purchase.quantity;
    }

    const { error: productUpdateError } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', purchase.product_id);

    if (productUpdateError) throw productUpdateError;

    return data;
}

export async function getSupplierMetrics(supplierId: string) {
    const { data: purchases, error: pError } = await supabase
        .from('supplier_purchases')
        .select('*, product:products(*)')
        .eq('supplier_id', supplierId);
    
    if (pError || !purchases || purchases.length === 0) {
        return { totalPurchased: 0, totalSpent: 0, totalSold: 0, currentStock: 0, products: [] };
    }

    const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
    const totalSpent = purchases.reduce((sum, p) => sum + (p.quantity * p.purchase_price), 0);
    
    const productIds = [...new Set(purchases.map(p => p.product_id))];
    
    const VALID_STATUSES = ['processing', 'shipped', 'delivered'];
    const { data: allSales } = await supabase
        .from('order_items')
        .select('product_id, quantity, orders!inner(status)')
        .in('product_id', productIds)
        .in('orders.status', VALID_STATUSES);
    
    const totalSold = allSales?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const currentStock = Math.max(0, totalPurchased - totalSold);

    // Group by product
    const productMap: Record<string, any> = {};
    purchases.forEach(p => {
        if (!productMap[p.product_id]) {
            productMap[p.product_id] = {
                id: p.product_id,
                title: p.product?.title || 'Unknown Product',
                image: p.product?.images?.[0] || null,
                purchasePrice: p.purchase_price, // Use last or average? Let's use last for now
                totalPurchased: 0,
                totalSpent: 0,
                totalSold: 0,
                currentStock: 0
            };
        }
        productMap[p.product_id].totalPurchased += p.quantity;
        productMap[p.product_id].totalSpent += (p.quantity * p.purchase_price);
        // Update to the latest purchase price
        productMap[p.product_id].purchasePrice = p.purchase_price;
    });

    allSales?.forEach(s => {
        if (productMap[s.product_id]) {
            productMap[s.product_id].totalSold += s.quantity;
        }
    });

    // Calculate stock per product
    Object.values(productMap).forEach((p: any) => {
        p.currentStock = Math.max(0, p.totalPurchased - p.totalSold);
    });

    const products = Object.values(productMap).sort((a, b) => b.totalPurchased - a.totalPurchased);

    return { totalPurchased, totalSpent, totalSold, currentStock, products };
}
