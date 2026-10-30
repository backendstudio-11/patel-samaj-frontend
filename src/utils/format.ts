/**
 * Formats an ISO date string into DD-MM-YYYY format
 */
export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  try {
    if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoString)) {
      const [y, m, d] = isoString.split('T')[0].split('-').map(Number);
      return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return '';
  }
};

/**
 * Formats an ISO date string into a highly readable format (e.g., "14 Jul 2026")
 */
export const formatFullDate = (isoString: string): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return '';
  }
};

export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

export const ensureArray = <T = any>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
};
