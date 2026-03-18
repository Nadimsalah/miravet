"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
    id: string
    name: string
    nameAr?: string
    price: number
    image: string
    quantity: number
    size?: string
    inStock: boolean
    stock: number
    resellerPrice?: number | null
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (id: string, size?: string) => void
    updateQuantity: (id: string, quantity: number, size?: string) => void
    clearCart: () => void
    cartCount: number
    isInitialized: boolean
    isCartOpen: boolean
    setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isInitialized, setIsInitialized] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)

    // Load from local storage
    useEffect(() => {
        const storedCart = localStorage.getItem("cart")
        if (storedCart) {
            try {
                setItems(JSON.parse(storedCart))
            } catch (e) {
                console.error("Failed to parse cart from local storage", e)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save to local storage
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("cart", JSON.stringify(items))
        }
    }, [items, isInitialized])

    const addItem = React.useCallback((newItem: CartItem) => {
        setItems((currentItems) => {
            const existingItemIndex = currentItems.findIndex(
                (item) => item.id === newItem.id && item.size === newItem.size
            )

            if (existingItemIndex > -1) {
                const updatedItems = [...currentItems]
                const item = updatedItems[existingItemIndex]
                updatedItems[existingItemIndex].quantity = item.quantity + newItem.quantity
                return updatedItems
            } else {
                return [...currentItems, newItem]
            }
        })
        setIsCartOpen(true)
    }, [])

    const removeItem = React.useCallback((id: string, size?: string) => {
        setItems((currentItems) =>
            currentItems.filter((item) => !(item.id === id && item.size === size))
        )
    }, [])

    const updateQuantity = React.useCallback((id: string, quantity: number, size?: string) => {
        if (quantity < 1) return
        setItems((currentItems) =>
            currentItems.map((item) => {
                if (item.id === id && item.size === size) {
                    return { ...item, quantity: quantity }
                }
                return item
            })
        )
    }, [])

    const clearCart = React.useCallback(() => {
        setItems([])
        localStorage.removeItem("cart")
    }, [])

    const cartCount = items.reduce((total, item) => total + item.quantity, 0)

    const contextValue = React.useMemo(() => ({
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartCount,
        isInitialized,
        isCartOpen,
        setIsCartOpen,
    }), [items, addItem, removeItem, updateQuantity, clearCart, cartCount, isInitialized, isCartOpen])

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
