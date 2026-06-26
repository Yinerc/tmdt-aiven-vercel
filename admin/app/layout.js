import "./globals.css";

export const metadata = {
  title: "TMDT Next.js",
  description: "Website thương mại điện tử chuyển từ PHP sang Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
