import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
  try {
    const { clinicId, clinicEmail } = await request.json();

    // Validate required fields
    if (!clinicId || !clinicEmail) {
      return NextResponse.json(
        { error: 'Clinic ID and email are required' },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = clinic.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: clinicEmail,
        metadata: {
          clinic_id: clinicId.toString(),
          clinic_name: clinic.doctor_name || 'Unknown Clinic',
        },
      });
      customerId = customer.id;

      // Update clinic with customer ID
      await supabase
        .from('clinics')
        .update({ stripe_customer_id: customerId })
        .eq('id', clinicId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${request.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        clinic_id: clinicId.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}