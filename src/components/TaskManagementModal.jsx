import React, { useState, useEffect } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { ModalWrapper } from './ModalWrapper';

export function TaskManagementModal({ onClose, isVisible, onOpenEditTask, viewingUserId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const tasksQueryUserId = viewingUserId || auth.currentUser?.uid;
    if (!tasksQueryUserId) {
      setLoading(false);
      return;
    }
    
    // CORREÇÃO: A query agora lista apenas as tarefas ativas ou que não têm o campo isArchived
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", tasksQueryUserId), 
      orderBy("createdAt")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Filtragem no front-end para incluir apenas tarefas não arquivadas
      const activeTasks = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(task => !task.isArchived); // Filtra por tasks que não têm 'isArchived: true'

      setTasks(activeTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [viewingUserId]);

  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'Sem Categoria';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {});

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Tem certeza que deseja ARQUIVAR esta tarefa? Ela não aparecerá mais nas suas listas ativas.")) {
      setIsDeleting(true);
      try {
        await updateDoc(doc(db, "tasks", taskId), { isArchived: true });
        console.log("Tarefa arquivada com sucesso!");
      } catch (error) {
        console.error("Erro ao arquivar tarefa:", error);
        alert("Erro ao arquivar tarefa: " + error.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteAllTasks = async () => {
    const confirmationMessage = "ATENÇÃO: Esta ação irá ARQUIVAR TODAS as tarefas ativas de forma permanente e não será possível recuperá-las.";
    
    if (window.confirm(confirmationMessage)) {
      setIsDeleting(true);
      try {
        const updatePromises = tasks.map(task => updateDoc(doc(db, "tasks", task.id), { isArchived: true }));
        await Promise.all(updatePromises);
        
        console.log("Todas as tarefas ativas foram arquivadas com sucesso!");
        onClose();
      } catch (error) {
        console.error("Erro ao arquivar todas as tarefas:", error);
        alert("Erro ao arquivar todas as tarefas: " + error.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title="Gerenciar Tarefas" size="lg">
      {loading ? (
        <p className="text-center text-gray-500">Carregando tarefas...</p>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 pr-2">
          {Object.keys(groupedTasks).length > 0 ? (
            Object.keys(groupedTasks).map((categoryName) => (
              <div key={categoryName} className="py-4">
                <h4 className="font-bold text-gray-700">{categoryName}</h4>
                <ul className="mt-2 space-y-2">
                  {groupedTasks[categoryName].map((task) => (
                    <li key={task.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                      <span className="text-sm">{task.taskName}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onOpenEditTask(task)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isDeleting}
                          className="text-sm text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Arquivar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 p-4">Nenhuma tarefa encontrada.</p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-between space-x-4">
        <button
          onClick={handleDeleteAllTasks}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Arquivando...' : 'Arquivar Todas as Tarefas'}
        </button>
      </div>
    </ModalWrapper>
  );
}