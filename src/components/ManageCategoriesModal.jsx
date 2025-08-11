import React, { useState, useEffect } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, deleteDoc, doc, updateDoc, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { ModalWrapper } from './ModalWrapper';

export function ManageCategoriesModal({ isVisible, onClose, categories, viewingUserId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categoriesForUser, setCategoriesForUser] = useState([]);
  
  const predefinedColors = [
    '#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EF4444', '#6B7280',
  ];

  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    const categoriesQueryUserId = viewingUserId || auth.currentUser?.uid;
    if (!categoriesQueryUserId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "categories"), where("userId", "==", categoriesQueryUserId), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategoriesForUser(categoriesArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isVisible, viewingUserId]);

  if (!isVisible) return null;

  const handleEdit = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color || predefinedColors[0]);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      setIsProcessing(true);
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (error) {
        console.error("Erro ao excluir categoria: ", error);
        alert("Erro ao excluir categoria: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeleteAllCategories = async () => {
    const confirmationMessage = "ATENÇÃO: Esta ação irá excluir TODAS as categorias de forma permanente e não será possível recuperá-las. Tem certeza que deseja continuar?";
    
    if (window.confirm(confirmationMessage)) {
      setIsProcessing(true);
      try {
        const deletePromises = categoriesForUser.map(category => deleteDoc(doc(db, "categories", category.id)));
        await Promise.all(deletePromises);
        
        onClose();
      } catch (error) {
        console.error("Erro ao excluir todas as categorias:", error);
        alert("Erro ao excluir todas as categorias: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!newCategoryName.trim()) {
      alert("O nome da categoria não pode ser vazio.");
      return;
    }
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "categories", editingCategory.id), {
        name: newCategoryName,
        color: newCategoryColor,
      });
      setEditingCategory(null);
    } catch (error) {
      console.error("Erro ao salvar categoria: ", error);
      alert("Erro ao salvar categoria: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title="Gerenciar Categorias" size="lg">
      {loading ? (
        <p className="text-center text-gray-500">Carregando categorias...</p>
      ) : (
        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
          {categoriesForUser.length > 0 ? (
            categoriesForUser.map(category => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-md shadow-sm bg-gray-50">
                {editingCategory?.id === category.id ? (
                  // Modo de Edição
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 w-full sm:w-auto border p-1 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCategoryColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${newCategoryColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'} transition-transform`}
                        />
                      ))}
                    </div>
                    <button onClick={handleSave} disabled={isProcessing} className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600 transition disabled:opacity-50">Salvar</button>
                    <button onClick={() => setEditingCategory(null)} className="bg-gray-500 text-white text-sm px-3 py-1 rounded-md hover:bg-gray-600 transition">Cancelar</button>
                  </div>
                ) : (
                  // Modo de Visualização
                  <div className="flex-1 flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: category.color }}></div>
                    <span className="text-md font-medium text-gray-800">{category.name}</span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(category)} className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-md hover:bg-yellow-600 transition">Editar</button>
                  <button onClick={() => handleDelete(category.id)} disabled={isProcessing} className="text-sm px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-50">Excluir</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">Nenhuma categoria encontrada.</div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-between space-x-4">
        <button
          onClick={handleDeleteAllCategories}
          disabled={isProcessing}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Excluindo...' : 'Excluir Todas as Categorias'}
        </button>
      </div>
    </ModalWrapper>
  );
}