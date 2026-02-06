/**
 * Currency formatting utility for Indian Rupee (INR)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Compact currency format is disabled at user request.
 * Always returns full currency format.
 */
export function formatCompactCurrency(amount: number): string {
    return formatCurrency(amount);
}
