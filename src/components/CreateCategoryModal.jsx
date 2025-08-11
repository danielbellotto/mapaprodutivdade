import React, { useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ModalWrapper } from './ModalWrapper';

export function CreateCategoryModal({ onClose, isVisible, viewingUserId }) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#3B82F6');
  const [isSaving, setIsSaving] = useState(false);
  
  const predefinedColors = [
    '#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EF4444', '#6B7280',
  ];

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (categoryName.trim() === '') {
      alert("O nome da categoria não pode ser vazio.");
      return;
    }

    setIsSaving(true);
    try {
      const categoryUserId = viewingUserId || auth.currentUser?.uid;
      if (!categoryUserId) {
        alert("Usuário não autenticado.");
        setIsSaving(false);
        return;
      }
      
      await addDoc(collection(db, "categories"), {
        name: categoryName,
        color: categoryColor,
        userId: categoryUserId, // Adicionando o ID do usuário
        createdAt: serverTimestamp(),
      });
      alert('Categoria criada com sucesso!');
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar categoria: ", error);
      alert("Erro ao adicionar categoria: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title="Criar Nova Categoria" size="sm">
      <form onSubmit={handleSaveCategory}>
        <div className="mb-4">
          <label htmlFor="categoryName" className="block text-gray-700 font-bold mb-2">Nome da Categoria</label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-purple-200"
            placeholder="Ex: Faixa Branca/Azul"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">Cor</label>
          <div className="flex space-x-2">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                style={{ backgroundColor: color }}
                onClick={() => setCategoryColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${categoryColor === color ? 'border-purple-500 scale-110' : 'border-gray-300'} transition-transform`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 text-white font-semibold rounded-md shadow-md transition ${isSaving ? 'bg-purple-300' : 'bg-purple-500 hover:bg-purple-600'}`}
          >
            {isSaving ? 'Salvando...' : 'Salvar Categoria'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}