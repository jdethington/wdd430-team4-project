'use client';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70"
                onClick={onCancel}
            />
            {/* Modal */}
            <div className="relative bg-[#2c2c2c] border border-[#f5c518]/30 rounded-sm p-8 max-w-sm w-full mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-6 bg-[#f5c518]" />
                    <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
                        Confirm
                    </span>
                </div>

                <h2 className="text-xl font-bold text-[#f5f5f4] mb-2">
                    {title}
                </h2>
                <p className="text-[#afb6c2] text-sm mb-8">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-[#afb6c2]/30 text-[#afb6c2] text-sm font-semibold rounded-sm hover:border-[#afb6c2]/60 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Removing...' : 'Remove'}
                    </button>
                </div>
            </div>
        </div>
    );
}