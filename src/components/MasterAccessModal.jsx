import React from 'react';
import { ModalWrapper } from './ModalWrapper';

export function MasterAccessModal({ isVisible, onClose, onSelectMasterMode, onSelectNormalMode }) {
  if (!isVisible) return null;

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title="Acesso Master" size="sm">
      <div className="space-y-4">
        <p className="text-center text-gray-700">Escolha o seu perfil de acesso:</p>
        <button
          onClick={onSelectNormalMode}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition"
        >
          Usuário Normal
        </button>
        <button
          onClick={onSelectMasterMode}
          className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 transition"
        >
          Gerenciamento Master
        </button>
      </div>
    </ModalWrapper>
  );
}