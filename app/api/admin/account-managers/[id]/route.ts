import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json({ error: 'Missing Account Manager ID' }, { status: 400 })
        }

        // 1. Cleanup assignments (soft delete them so they don't break history but are no longer active)
        const { error: assignError } = await supabaseAdmin
            .from('account_manager_assignments')
            .update({ soft_deleted_at: new Date().toISOString() })
            .eq('account_manager_id', id)
            .is('soft_deleted_at', null)

        if (assignError) throw assignError

        // 2. Delete the auth user
        // This will automatically delete the profile due to ON DELETE CASCADE
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

        if (authError) {
            // If user doesn't exist in Auth, we still try to delete profile as fallback
            if (authError.message.includes('User not found')) {
                const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id)
                if (profileError) throw profileError
            } else {
                throw authError
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Account Manager deleted successfully'
        })
    } catch (error: any) {
        console.error('Delete Account Manager Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
