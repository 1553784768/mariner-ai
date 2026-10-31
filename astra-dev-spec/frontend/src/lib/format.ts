export const formatMoney = (value: number, signed = false) => `${value < 0 ? "−" : signed ? "+" : ""}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatPercent = (value: number) => `${value.toFixed(1)}%`;
export const formatTime = (value: string, seconds = false) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}), hour12: false }).format(new Date(value));
