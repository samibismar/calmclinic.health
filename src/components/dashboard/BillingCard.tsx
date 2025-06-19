"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BillingCardProps {
  clinic: {
    id: number;
    email: string;
    doctor_name: string;
    is_paid?: boolean;
    subscription_status?: string;
    current_period_end?: string;
  };
}

export default function BillingCard({ clinic }: BillingCardProps) {
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check current payment status
    fetchPaymentStatus();
  }, [clinic.id]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch('/api/clinic/me');
      const data = await response.json();
      setIsPaid(data.isPaid || false);
      setSubscriptionStatus(data.clinic?.subscription_status || null);
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const handleStartSubscription = async () => {
    setLoading(true);
    try {
      // Get the latest clinic data
      const clinicResponse = await fetch('/api/clinic/me');
      const clinicData = await clinicResponse.json();
      
      if (!clinicData.clinic) {
        alert('Error: Could not get clinic information');
        return;
      }

      console.log('🏥 Sending to Stripe:', {
        clinicId: clinicData.clinic.id,
        clinicEmail: clinicData.clinic.email
      });

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId: clinicData.clinic.id,
          clinicEmail: clinicData.clinic.email,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        alert('Error: ' + error);
        return;
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
          alert('Error redirecting to checkout');
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Billing & Subscription</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPaid 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
        }`}>
          {isPaid ? 'ACTIVE' : 'FREE TRIAL'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className={`w-3 h-3 rounded-full mr-3 ${isPaid ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-white font-medium">
              {isPaid ? 'Pro Subscription Active' : 'Free Trial'}
            </span>
          </div>
          
          <div className="text-sm text-blue-100 space-y-1">
            <p><strong>Status:</strong> {subscriptionStatus || 'Trial'}</p>
            <p><strong>Plan:</strong> {isPaid ? 'CalmClinic Pro ($29/month)' : 'Free Trial'}</p>
            {clinic.current_period_end && (
              <p><strong>Next billing:</strong> {new Date(clinic.current_period_end).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-white font-medium">Plan Features:</h4>
          <div className="space-y-1 text-sm text-blue-100">
            <div className="flex items-center">
              <svg className={`w-4 h-4 mr-2 ${isPaid ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Unlimited chat conversations
            </div>
            <div className="flex items-center">
              <svg className={`w-4 h-4 mr-2 ${isPaid ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Custom branding & colors
            </div>
            <div className="flex items-center">
              <svg className={`w-4 h-4 mr-2 ${isPaid ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Priority support
            </div>
            <div className="flex items-center">
              <svg className={`w-4 h-4 mr-2 ${isPaid ? 'text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Advanced analytics
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isPaid && (
          <button
            onClick={handleStartSubscription}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting Subscription...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Upgrade to Pro - $29/month
              </>
            )}
          </button>
        )}

        {isPaid && (
          <div className="text-center py-2">
            <p className="text-green-300 text-sm">✨ You're on the Pro plan!</p>
          </div>
        )}
      </div>
    </div>
  );
}