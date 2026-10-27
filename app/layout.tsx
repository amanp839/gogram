import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGram | Wayanad, Your Way",
  description: "Discover stays, trekking, camping and nature escapes in Wayanad, Kerala."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
