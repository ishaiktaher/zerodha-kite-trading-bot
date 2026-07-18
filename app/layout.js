import "./globals.css";

export const metadata = {
  title: "Zeta Gain | Personal Trading Terminal",
  description: "A personal Zerodha strategy and trading dashboard",
  applicationName: "Zeta Gain",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
