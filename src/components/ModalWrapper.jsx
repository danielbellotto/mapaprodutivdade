import React from 'react';

export function ModalWrapper({ children, onClose, isVisible, title, size = 'md' }) {
    if (!isVisible) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-2xl', // Ajustado o tamanho padrão para ser um pouco maior
        lg: 'max-w-4xl', // Novo tamanho grande
        xl: 'max-w-screen-xl', // Novo tamanho extra grande
        full: 'max-w-full'
    };
    const modalSizeClass = sizeClasses[size] || sizeClasses.md;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 pt-16"
            onClick={onClose}
        >
            <div 
                className={`relative p-6 bg-white w-full rounded-xl shadow-2xl font-inter ${modalSizeClass}`}
                onClick={(e) => e.stopPropagation()} // Impede que o clique no modal feche-o
            >
                <div className="flex justify-between items-center pb-4 border-b">
                    {title && (
                        <h2 className="text-2xl font-bold text-center text-gray-800">
                            {title}
                        </h2>
                    )}
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold ml-auto">
                        &times;
                    </button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}