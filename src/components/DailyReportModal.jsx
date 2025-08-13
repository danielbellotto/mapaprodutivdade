import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { ModalWrapper } from './ModalWrapper';

export function DailyReportModal({ onClose, isVisible, allTasks, date, categories, viewingUserId }) {
    const [tasksForDate, setTasksForDate] = useState([]);
    const [dailyCompletionsData, setDailyCompletionsData] = useState({});

    // FUNÇÕES DE AJUDA PARA CORES E TEXTOS (ADICIONADAS AQUI)
    const getCategoryColor = (categoryName) => {
      const category = categories.find(cat => cat.name === categoryName);
      return category?.color || '#D1D5DB';
    };

    const getPriorityText = (priority) => {
      switch(priority) {
        case 'importante-urgente': return 'Importante e Urgente';
        case 'importante-nao-urgente': return 'Importante mas Não Urgente';
        case 'urgente-nao-importante': return 'Urgente mas Não Importante';
        case 'nao-urgente-nao-importante': return 'Não Urgente e Não Importante';
        default: return 'Sem Prioridade';
      }
    };
    
    const getPriorityColor = (priority) => {
      switch(priority) {
        case 'importante-urgente': return 'bg-green-500';
        case 'importante-nao-urgente': return 'bg-orange-500';
        case 'urgente-nao-importante': return 'bg-blue-500';
        case 'nao-urgente-nao-importante': return 'bg-red-500';
        default: return 'bg-gray-400';
      }
    };

    useEffect(() => {
        if (!date || !isVisible || !viewingUserId) return;

        const formattedDate = date.toISOString().slice(0, 10);

        const tasksOnDate = allTasks.filter(task => {
            const currentDayOfWeek = date.getDay();
            
            if (task.isDaily) {
                return currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
            } else {
                return task.selectedDays?.includes(currentDayOfWeek);
            }
        });
        
        setTasksForDate(tasksOnDate);

        const qCompletions = query(
            collection(db, "dailyCompletions"), 
            where("userId", "==", viewingUserId),
            where("completionDate", "==", formattedDate)
        );
        
        const unsubscribeCompletions = onSnapshot(qCompletions, (querySnapshot) => {
            const completionsMap = {};
            querySnapshot.docs.forEach(doc => {
                const completionData = doc.data();
                completionsMap[completionData.taskId] = completionData;
            });
            setDailyCompletionsData(completionsMap);
        });

        return () => unsubscribeCompletions();

    }, [date, isVisible, allTasks, viewingUserId]);

    const completedTasks = tasksForDate.filter(task => dailyCompletionsData[task.id]);
    const pendingTasks = tasksForDate.filter(task => !dailyCompletionsData[task.id]);
    
    const formattedDate = date ? date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    }).replace(/\./g, '') : '';

    return (
        <ModalWrapper onClose={onClose} isVisible={isVisible} title={`Relatório Diário - ${formattedDate}`} size="lg">
            {tasksForDate.length === 0 ? (
                <p className="text-center text-gray-500 p-4">Nenhuma tarefa encontrada para este dia.</p>
            ) : (
                <div className="space-y-6">
                    {/* Tabela de Tarefas Concluídas */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">Tarefas Concluídas ({completedTasks.length})</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tarefa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Prioridade
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Categoria
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Concluída em
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {completedTasks.map(task => {
                                        const categoryColor = getCategoryColor(task.category);
                                        const completionTime = dailyCompletionsData[task.id]?.completionTimestamp?.toDate();

                                        return (
                                            <tr key={task.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {task.taskName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getPriorityColor(task.priority)}`}>
                                                        {getPriorityText(task.priority)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white`} style={{backgroundColor: categoryColor}}>
                                                      {task.category}
                                                  </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {completionTime ? completionTime.toLocaleTimeString('pt-BR') : 'N/A'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tabela de Tarefas Pendentes */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">Tarefas Pendentes ({pendingTasks.length})</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tarefa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Prioridade
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Categoria
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingTasks.map(task => {
                                        const categoryColor = getCategoryColor(task.category);
                                        return (
                                            <tr key={task.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {task.taskName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getPriorityColor(task.priority)}`}>
                                                        {getPriorityText(task.priority)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white`} style={{backgroundColor: categoryColor}}>
                                                      {task.category}
                                                  </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </ModalWrapper>
    );
}