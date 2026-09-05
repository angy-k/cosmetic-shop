"use client";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "../contexts/LanguageContext";
import { translateStripeError } from "../lib/translations";

const PaymentForm = ({ clientSecret, onPaymentSuccess, onError, submitting, setSubmitting }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { error: showError } = useToast();
  const { t, language } = useTranslation();
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    
    setSubmitting(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        // Stripe's error.message is English-only - translate known codes
        const translatedMessage = translateStripeError(error, language) || error.message;
        showError(translatedMessage);
        if (onError) {
          // Pass the intent id along so the backend can be told too (confirmPaymentResult)
          onError({ ...error, message: translatedMessage }, error.payment_intent?.id);
        }
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentIntent);
        }
      } else {
        const err = new Error(t('payment.paymentFailedWithStatus', { status: paymentIntent.status }));
        err.paymentIntentId = paymentIntent.id;
        throw err;
      }
    } catch (error) {
      showError(error.message || t('payment.genericError'));
      if (onError) {
        onError(error, error.paymentIntentId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
          onChange={(e) => setCardComplete(e.complete)}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || !cardComplete || submitting}
        className="w-full py-3 px-4 rounded-md text-white font-medium transition-opacity disabled:cursor-not-allowed"
        style={{
          background: (!stripe || !cardComplete || submitting) ? 'var(--muted)' : 'var(--brand)',
          opacity: (!stripe || !cardComplete || submitting) ? 0.6 : 1
        }}
      >
        {submitting ? t('payment.processing') : t('payment.payNow')}
      </button>
    </form>
  );
};

export default PaymentForm;
