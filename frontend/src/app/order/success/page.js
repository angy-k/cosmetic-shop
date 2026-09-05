"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../../contexts/CartContext";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import { useTranslation } from '@/contexts/LanguageContext';

export default function OrderSuccessPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { clearCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('orderSuccess.title')}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('orderSuccess.text')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('orderSuccess.continueShopping')}
          </Link>
          <Link
            href="/orders"
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('orderSuccess.viewOrders')}
          </Link>
        </div>
      </div>
    </div>
  );
}
