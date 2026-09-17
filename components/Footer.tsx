import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[#1a1a1a] border-t border-[#2c2c2c] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div>
                    <span className="font-serif text-xl font-bold tracking-widest text-[#f5f5f4]">
                        WATCH<span className="text-[#f5c518]">LIST</span>
                    </span>
                    <p className="text-sm text-[#afb6c2] mt-1">
                        Organize and track your movie journey.
                    </p>
                </div>

                <div className="flex items-center gap-6 text-sm text-[#afb6c2]">
                    <Link href="/login" className="hover:text-[#f5c518] transition-colors">
                        Sign In
                    </Link>
                    <Link href="/signup" className="hover:text-[#f5c518] transition-colors">
                        Sign Up
                    </Link>
                </div>

                <p className="text-xs text-[#afb6c2]/60">
                    &copy; {new Date().getFullYear()} WatchList. WDD 430 Project.
                </p>
            </div>
        </footer>
    );
}