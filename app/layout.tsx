import "./globals.css";

export const metadata = {
  title: "AI Jailbreak Competition",
  description: "AI Jailbreak Competition Site",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50">{children}</body>
    </html>
  );
}