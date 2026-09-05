// Prices are stored/displayed in RSD, but Stripe doesn't support charging in
// RSD, so checkout converts to EUR at a fixed demo rate.

export const EUR_TO_RSD_RATE = 117.5;

export function formatRSD(amount) {
  return new Intl.NumberFormat('sr-Latn-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatEUR(amount) {
  return new Intl.NumberFormat('sr-Latn-RS', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function rsdToEur(amountRsd) {
  return (amountRsd || 0) / EUR_TO_RSD_RATE;
}

export function rsdToEurCents(amountRsd) {
  return Math.round(rsdToEur(amountRsd) * 100);
}
