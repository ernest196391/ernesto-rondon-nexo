import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interpretar vale de Casa Viva",
  description: "Revisa y corrige la interpretación de un vale operativo con NEXO antes de enviarlo al Core Casa Viva.",
  robots: { index: false, follow: false },
};

export default function VoucherReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
