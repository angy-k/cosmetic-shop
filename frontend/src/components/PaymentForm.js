"use client";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useToast } from "../contexts/ToastContext";

const PaymentForm = ({ clientSecret, onPaymentSuccess, onError, submitting, setSubmitting }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { error: showError } = useToast();
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
        showError(error.message);
        if (onError) {
          onError(error);
        }
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentIntent);
        }
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
    } catch (error) {
      showError(error.message || 'An error occurred during payment');
      if (onError) {
        onError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
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
        className={`w-full py-3 px-4 rounded-md text-white font-medium ${
          !stripe || !cardComplete || submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {submitting ? 'Processing...' : `Pay Now`}
      </button>
    </form>
  );
};

export default PaymentForm;
