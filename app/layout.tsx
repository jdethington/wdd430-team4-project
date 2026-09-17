import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'WatchList | Organize & Track Your Movie Journey',
  description: 'A private space for movie fans to discover, save, and review films.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a1a] text-[#f5f5f4] min-h-screen flex flex-col antialiased">
        <Navbar />
        {/* Flexbox sticky footer - the footer is pushed to the bottom of the screen even on short pages */}
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
