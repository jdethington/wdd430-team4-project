import Link from 'next/link';
import Button from './ui/Button';

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#2c2c2c]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                {/* Brand Logo */}
                <Link href="/" className="group flex items-center gap-2">
                    <span className="font-serif text-3xl font-bold tracking-widest text-[#f5f5f4] group-hover:text-[#f5c518] transition-colors">
                        WATCH<span className="text-[#f5c518]">LIST</span>
                    </span>
                </Link>

                {/* Navigation Actions */}
                <nav className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-[#afb6c2] hover:text-[#f5f5f4] transition-colors px-3 py-2 uppercase tracking-wider"
                    >
                        Sign In
                    </Link>
                    {/* Insert the button component */}
                    <Button href="/signup" variant="primary">
                        Get Started
                    </Button>
                </nav>
            </div>

            {/* Art Deco Gold Accent Line */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#f5c518]/30 to-transparent" />
        </header>
    );
}