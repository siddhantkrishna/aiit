import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase();
  return `AIIT-${year}-${random}`;
}

export function generateVacancyApplicationId(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase();
  return `AIIT-VAC-${year}-${random}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
