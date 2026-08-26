/**
 * POST /api/profile/avatar — real image upload to Supabase Storage.
 * Validates type/size server-side; path is namespaced per user so nobody
 * can overwrite another developer's avatar.
 */

import { authenticate } from '@/lib/assessment/route-helpers'
import { createServiceClient } from '@/lib/admin/service-client'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export async function POST(request: Request): Promise<Response> {
  try {
    const { svc, appUserId } = await authenticate()
    const storageSvc = createServiceClient()

    const formData = await request.formData().catch(() => null)
    const file = formData?.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'فایلی ارسال نشد.' }, { status: 400 })
    }

    const ext = ALLOWED.get(file.type)
    if (!ext) {
      return Response.json(
        { error: 'فقط تصویر JPG، PNG یا WebP مجاز است.' },
        { status: 400 },
      )
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'حجم تصویر حداکثر ۲ مگابایت است.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const path = `${appUserId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await storageSvc.storage
      .from('avatars')
      .upload(path, bytes, { contentType: file.type, upsert: false })
    if (uploadError) {
      return Response.json({ error: 'آپلود ناموفق بود؛ دوباره تلاش کن.' }, { status: 500 })
    }

    const { data } = storageSvc.storage.from('avatars').getPublicUrl(path)

    const { error: updateError } = await svc
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('user_id', appUserId)
    if (updateError) {
      return Response.json({ error: 'ذخیره آدرس عکس ناموفق بود.' }, { status: 500 })
    }

    return Response.json({ ok: true, url: data.publicUrl })
  } catch {
    return Response.json({ error: 'برای این عملیات باید وارد شوید.' }, { status: 401 })
  }
}
