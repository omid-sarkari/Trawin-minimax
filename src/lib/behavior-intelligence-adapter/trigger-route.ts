// API Route Handler for Behavior Intelligence
export async function POST(request: Request) {
  try {
    const { codingSessionId } = await request.json();
    if (!codingSessionId) return new Response(JSON.stringify({ error: 'codingSessionId is required' }), { status: 400 });
    
    const { runBehaviorAnalysis } = require('behavior-intelligence');
    const { NextjsBehaviorIntelligenceAdapter } = require('./nextjs.adapter');
    const { createServerClient } = require('@supabase/ssr');
    
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const adapter = new NextjsBehaviorIntelligenceAdapter(supabase);
    await runBehaviorAnalysis(adapter, codingSessionId);
    
    return new Response(JSON.stringify({ success: true, codingSessionId }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}