import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF from '@react-pdf/renderer';
import { PlanDocument } from '@/components/pdf/PlanDocument';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch plan with all details
  const { data: plan } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('id', id)
    .eq('dietitian_id', user.id)
    .single();

  if (!plan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch dietitian profile
  const { data: dietitian } = await supabase
    .from('dietitians')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch client
  let client = null;
  if (plan.client_id) {
    const { data } = await supabase.from('clients').select('*').eq('id', plan.client_id).single();
    client = data;
  }

  // Fetch days → slots → items → foods
  const { data: days } = await supabase
    .from('plan_days')
    .select('*')
    .eq('plan_id', id)
    .order('day_number');

  const dayIds = (days ?? []).map((d) => d.id);
  const { data: slots } = dayIds.length > 0
    ? await supabase.from('meal_slots').select('*').in('day_id', dayIds).order('sort_order')
    : { data: [] };

  const slotIds = (slots ?? []).map((s) => s.id);
  const { data: items } = slotIds.length > 0
    ? await supabase.from('meal_items').select('*').in('slot_id', slotIds).order('sort_order')
    : { data: [] };

  const foodIds = [...new Set((items ?? []).map((i) => i.food_id))];
  const { data: foods } = foodIds.length > 0
    ? await supabase.from('foods').select('*').in('id', foodIds)
    : { data: [] };

  const foodMap = new Map((foods ?? []).map((f) => [f.id, f]));

  const planData = {
    plan,
    dietitian,
    client,
    days: (days ?? []).map((day) => ({
      ...day,
      slots: (slots ?? [])
        .filter((s) => s.day_id === day.id)
        .map((slot) => ({
          ...slot,
          items: (items ?? [])
            .filter((i) => i.slot_id === slot.id)
            .map((item) => ({
              ...item,
              food: foodMap.get(item.food_id),
            })),
        })),
    })),
  };

  try {
    const pdfStream = await ReactPDF.renderToStream(
      PlanDocument({ data: planData }),
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="diyet-plani-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 },
    );
  }
}
