import { runBehaviorAnalysis } from 'behavior-intelligence'
import { NextjsBehaviorIntelligenceAdapter } from './nextjs.adapter'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request): Promise<Response> {
  try {
    const { codingSessionId } = await request.json()
    if (!codingSessionId) {
      return Response.json({ error: 'codingSessionId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const adapter = new NextjsBehaviorIntelligenceAdapter(supabase)
    await runBehaviorAnalysis(adapter, codingSessionId)

    return Response.json({ success: true, codingSessionId }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: message }, { status: 500 })
  }
}
