import React from 'react';

export function ModalWrapper({ children, onClose, title, isVisible, size = 'md' }) {
  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className={`relative p-6 bg-white w-full rounded-xl shadow-2xl font-inter ${sizeClasses[size]}`}>
        {title && (
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
            {title}
          </h2>
        )}
        
        {children}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}