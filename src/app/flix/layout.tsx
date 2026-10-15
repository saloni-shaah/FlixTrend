import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/flix",
  },
};

export default function FlixLayout({ children }: { children: React.ReactNode }) {
  return children;
}
