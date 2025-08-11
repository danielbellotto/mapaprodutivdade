import React from 'react';

export function DailyReportModal({ isVisible, onClose, allTasks, date, categories }) {
  if (!isVisible) return null;

  const currentDayOfWeek = date.getDay();
  const tasksForDay = allTasks.filter(task => {
    const taskDate = task.createdAt?.toDate();
    if (!taskDate) return false;

    // Lógica para tarefas diárias e recorrentes
    const isCreatedOnDay = taskDate.getDate() === date.getDate() &&
                           taskDate.getMonth() === date.getMonth() &&
                           taskDate.getFullYear() === date.getFullYear();
    
    const isRecurringOnDay = !task.isDaily && task.selectedDays?.includes(currentDayOfWeek);
    
    return isCreatedOnDay || isRecurringOnDay;
  });

  // Agrupar tarefas por categoria para exibição
  const tasksByCategory = tasksForDay.reduce((acc, task) => {
    const categoryName = task.category || 'Sem Categoria';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(task);
    return acc;
  }, {});

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });

  // Função para encontrar a cor da categoria
  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#D1D5DB';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center font-inter z-50">
      <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-xl w-full m-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Relatório Diário - {formattedDate}</h2>

        {Object.keys(tasksByCategory).length > 0 ? (
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {Object.keys(tasksByCategory).map(categoryName => (
              <div key={categoryName} className="p-4 rounded-xl shadow-md" style={{ backgroundColor: getCategoryColor(categoryName) + '40' }}>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{categoryName}</h3>
                <ul className="space-y-2">
                  {tasksByCategory[categoryName].map(task => (
                    <li key={task.id} className="flex items-center space-x-2 text-gray-800">
                      {task.completed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className={`text-md ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.taskName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">Nenhuma tarefa encontrada para este dia.</div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}