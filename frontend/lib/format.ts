export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0);

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const SERVICE_LABEL: Record<string, string> = {
  WASH: 'Wash',
  IRON: 'Iron',
  WASH_AND_IRON: 'Wash + Iron',
  DRY_CLEAN: 'Dry Clean',
};

export const STATUS_LABEL: Record<string, string> = {
  CREATED: 'Created',
  RECEIVED: 'Received',
  WASHING: 'Washing',
  DRYING: 'Drying',
  IRONING: 'Ironing',
  QUALITY_CHECK: 'Quality Check',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_FLOW = [
  'CREATED',
  'RECEIVED',
  'WASHING',
  'DRYING',
  'IRONING',
  'QUALITY_CHECK',
  'READY',
  'DELIVERED',
] as const;
