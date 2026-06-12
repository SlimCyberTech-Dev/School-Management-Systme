export const FEE_CATEGORIES = ["Tuition", "Meals", "Development"] as const;

export type FeeCategory = (typeof FEE_CATEGORIES)[number];

export const PAYMENT_METHODS = ["cash", "mobile_money"] as const;
