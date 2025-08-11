import React, { useState, useEffect } from 'react';

export function ReportModal({ onClose, isVisible, allTasks, userData, onOpenDailyReport }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [monthlyProductivity, setMonthlyProductivity] = useState({
    completed: 0,
    total: 0,
    percentage: 0
  });
  const [dailyProductivity, setDailyProductivity] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isVisible) return null;
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    setIsLoading(true);
    
    // Filtra todas as tarefas pelo mês e ano selecionados
    const tasksInSelectedMonth = allTasks.filter(task => {
      const taskDate = task.createdAt?.toDate();
      return taskDate &&
             taskDate.getMonth() === selectedMonth &&
             taskDate.getFullYear() === selectedYear;
    });

    // Calcula a produtividade mensal
    const completedMonthlyTasks = tasksInSelectedMonth.filter(t => t.completed).length;
    const totalMonthlyTasks = tasksInSelectedMonth.length;
    const monthlyProgress = totalMonthlyTasks > 0 ? (completedMonthlyTasks / totalMonthlyTasks) * 100 : 0;
    
    setMonthlyProductivity({
      completed: completedMonthlyTasks,
      total: totalMonthlyTasks,
      percentage: monthlyProgress.toFixed(0),
    });

    // Lógica para Produtividade Diária
    const dailyData = {};
    const userRegistrationDate = userData?.createdAt?.toDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

    let currentDateLoop = new Date(firstDayOfMonth);
    if (userRegistrationDate && userRegistrationDate > firstDayOfMonth) {
      currentDateLoop = userRegistrationDate;
    }
    
    while (currentDateLoop <= lastDayOfMonth) {
      const day = currentDateLoop.getDate();
      
      const tasksOnThisDay = tasksInSelectedMonth.filter(task => {
        const taskDate = task.createdAt.toDate();
        return taskDate.getDate() === day;
      });
      
      const completedTasks = tasksOnThisDay.filter(task => task.completed).length;
      const totalTasks = tasksOnThisDay.length;
      const productivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      dailyData[day] = {
        completed: completedTasks,
        total: totalTasks,
        productivity: productivity.toFixed(0),
      };

      currentDateLoop.setDate(currentDateLoop.getDate() + 1);
    }
    setDailyProductivity(dailyData);

    setIsLoading(false);
  }, [selectedMonth, selectedYear, allTasks, userData]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center font-inter z-50">
      <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-lg w-full m-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Relatórios de Produtividade</h2>

        {/* Seletores de Mês e Ano */}
        <div className="flex justify-center items-center space-x-4 mb-6">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Produtividade Mensal */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Produtividade Mensal ({months[selectedMonth]} {selectedYear})</h3>
          <div className="flex justify-center items-center my-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-green-500 text-2xl font-bold">
              {monthlyProductivity.percentage}%
            </div>
          </div>
          <p className="text-gray-600">{monthlyProductivity.completed} de {monthlyProductivity.total} tarefas concluídas</p>
        </div>

        {/* Produtividade Diária */}
        <div className="max-h-64 overflow-y-auto mt-6 border-t pt-4">
          <h3 className="text-xl font-bold mb-2 text-center">Produtividade Diária</h3>
          {isLoading ? (
            <div className="text-center text-gray-500">Carregando dados...</div>
          ) : (
            Object.keys(dailyProductivity).length > 0 ? (
              Object.keys(dailyProductivity).map(day => (
                <div 
                  key={day} 
                  className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-gray-200 transition cursor-pointer rounded-md"
                  onClick={() => onOpenDailyReport(new Date(selectedYear, selectedMonth, day))}
                >
                  <span className="font-semibold text-gray-700">Dia {day}:</span>
                  <span className={`font-semibold ${dailyProductivity[day].productivity >= 75 ? 'text-green-600' : dailyProductivity[day].productivity >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {dailyProductivity[day].completed} de {dailyProductivity[day].total} ({dailyProductivity[day].productivity}%)
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">Nenhum dado de produtividade encontrado para este mês.</div>
            )
          )}
        </div>

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