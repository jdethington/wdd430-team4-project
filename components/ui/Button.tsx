// components/ui/Button.tsx
// create a reusable Button component, allowing consistent styling across the app in one central place
// can define variants and behavior
import React from 'react';
import Link from 'next/link';

// define the TypeScript interface for Props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    href?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Button({
    variant = 'primary',
    href,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] rounded-sm uppercase text-sm px-6 py-3 font-sans';

    // define variant styling maps
    const variants = {
        primary:
            'bg-[#f5c518] text-[#1a1a1a] font-semibold hover:bg-[#d4a713] hover:shadow-[0_0_15px_rgba(245,197,24,0.3)] border border-[#f5c518]',
        secondary:
            'bg-transparent text-[#f5f5f4] border border-[#afb6c2]/40 hover:border-[#f5c518] hover:text-[#f5c518] hover:bg-[#2c2c2c]/50',
    };

    const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none bg-gray-700 text-gray-400 border-gray-700';

    const combinedClasses = `${baseStyles} ${disabled ? disabledStyles : variants[variant]} ${className}`;

    if (href && !disabled) {
        return (
            <Link href={href} className={combinedClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button className={combinedClasses} disabled={disabled} {...props}>
            {/* Whatever was wrapped inside <Button>...</Button>gets rendered here */}
            {children}
        </button>
    );
}