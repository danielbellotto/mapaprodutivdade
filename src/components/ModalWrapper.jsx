import React from 'react';

export function ModalWrapper({ children, onClose, onSave, isVisible, title, size = 'md' }) {
    if (!isVisible) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-screen-xl',
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
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center pb-4 border-b">
                    {title && (
                        <h2 className="text-2xl font-bold text-center text-gray-800">
                            {title}
                        </h2>
                    )}
                    {/* Botão de fechar que também salva, se a função onSave for passada */}
                    {onSave ? (
                        <div className="flex space-x-2 ml-auto">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 transition"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={onSave}
                                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 transition"
                            >
                                Salvar e Fechar
                            </button>
                        </div>
                    ) : (
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold ml-auto">
                            &times;
                        </button>
                    )}
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}