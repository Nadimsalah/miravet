import { NextResponse } from "next/server"
import { createOrder } from "@/lib/supabase-api"
import { sendPushNotification } from "@/lib/push-notifications"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { customer, cart, customerId } = body

        // Validate required fields
        if (!customer.fullName || !customer.phone || !customer.city || !customer.address) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Persist to Supabase
        const { order, error } = await createOrder({
            customerId,
            customer: {
                name: customer.fullName,
                email: customer.email || `guest_${Date.now()}@example.com`,
                phone: customer.phone,
                address_line1: customer.address,
                city: customer.city
            },
            items: cart.items.map((item: any) => ({
                product_id: item.id,
                product_title: item.name,
                product_sku: item.sku || 'N/A',
                product_image: item.image || null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            })),
            subtotal: cart.subtotal,
            shipping_cost: cart.shipping,
            total: cart.total,
            payment_method: body.paymentMethod || 'cod'
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // Send push notification and wait for it
        await sendPushNotification({
            title: "New Order! 🛍️",
            body: `Order ${order.order_number} received from ${customer.fullName} for MAD ${cart.total}`,
            url: `/admin/orders/${order.id}`,
            tag: 'new-order'
        }).catch(err => console.error("Push notify failed:", err))

        return NextResponse.json({
            redirectUrl: "/checkout/success",
            orderId: order.id
        })
    } catch (error) {
        console.error("Checkout error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
