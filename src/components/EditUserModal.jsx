import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { db, auth } from '../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export function EditUserModal({ onClose, isVisible, viewingUserId }) {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userIdToFetch = viewingUserId || auth.currentUser?.uid;
      if (!userIdToFetch) {
        setLoading(false);
        return;
      }
      
      const userRef = doc(db, 'users', userIdToFetch);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || '');
        setSector(data.sector || '');
        setPosition(data.position || '');
      }
      setLoading(false);
    };

    if (isVisible) {
      fetchUserData();
    }
  }, [isVisible, viewingUserId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userIdToUpdate = viewingUserId || auth.currentUser?.uid;
      if (!userIdToUpdate) {
        alert("Erro: Nenhum usuário para atualizar.");
        setIsSaving(false);
        return;
      }

      const userRef = doc(db, 'users', userIdToUpdate);
      await updateDoc(userRef, {
        name,
        sector,
        position,
      });
      alert('Dados atualizados com sucesso!');
      onClose();
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title="Editar Dados do Usuário">
      {loading ? (
        <p className="text-center text-gray-500">Carregando dados...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Setor</label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Função</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white font-semibold rounded-md shadow-md transition ${isSaving ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
}