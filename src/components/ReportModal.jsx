import React, { useState, useEffect } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { ModalWrapper } from './ModalWrapper';
import { getLocalDayBounds } from '../utils/dateUtils';

export function ReportModal({ onClose, isVisible, allTasks, userData, onOpenDailyReport, viewingUserId, size = "md" }) {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthlyReportData, setMonthlyReportData] = useState({});
    const [loading, setLoading] = useState(true);
    const [monthlyOffTaskTime, setMonthlyOffTaskTime] = useState(0);

    const userId = viewingUserId || auth.currentUser?.uid;

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        if (!isVisible || !userId) {
            return;
        }

        setLoading(true);

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const qCompletions = query(
            collection(db, "dailyCompletions"),
            where("userId", "==", userId)
        );

        const qOffTask = query(
            collection(db, "offTaskSessions"),
            where("userId", "==", userId)
        );

        const unsubscribeCompletions = onSnapshot(qCompletions, (querySnapshot) => {
            const completionsMap = {};
            const monthString = (month + 1).toString().padStart(2, '0');
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const completionDate = data.completionDate;
                if (completionDate && completionDate.startsWith(`${year}-${monthString}`)) {
                    if (!completionsMap[completionDate]) {
                        completionsMap[completionDate] = { completed: 0, total: 0, tasks: [] };
                    }
                    completionsMap[completionDate].completed++;
                    completionsMap[completionDate].tasks.push(data.taskId);
                }
            });

            const updatedReportData = {};
            for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
                const dayKey = d.toISOString().slice(0, 10);
                const dayOfWeek = d.getDay();
                
                const tasksForDay = allTasks.filter(task => {
                    if (task.isArchived) return false;
                    if (task.isDaily) {
                        return true; 
                    } else {
                        return task.selectedDays?.includes(dayOfWeek);
                    }
                });

                const completedForDay = completionsMap[dayKey]?.completed || 0;
                
                updatedReportData[dayKey] = {
                    date: new Date(d),
                    completed: completedForDay,
                    total: tasksForDay.length,
                    percentage: tasksForDay.length > 0 ? (completedForDay / tasksForDay.length) * 100 : 0
                };
            }
            setMonthlyReportData(updatedReportData);
            setLoading(false);
        });

        const unsubscribeOffTask = onSnapshot(qOffTask, (querySnapshot) => {
            const totalOffTaskDuration = querySnapshot.docs
                .filter(doc => {
                    const docDate = doc.data().completionDate;
                    const monthString = (month + 1).toString().padStart(2, '0');
                    return docDate && docDate.startsWith(`${year}-${monthString}`);
                })
                .reduce((acc, doc) => acc + (doc.data().duration || 0), 0);
            setMonthlyOffTaskTime(totalOffTaskDuration);
        });

        return () => {
            unsubscribeCompletions();
            unsubscribeOffTask();
        };

    }, [isVisible, userId, allTasks, month, year]);

    const handleMonthChange = (e) => {
        setMonth(parseInt(e.target.value));
    };

    const handleYearChange = (e) => {
        setYear(parseInt(e.target.value));
    };

    const allMonthlyTasks = Object.values(monthlyReportData);
    const totalTasks = allMonthlyTasks.reduce((acc, day) => acc + day.total, 0);
    const totalCompleted = allMonthlyTasks.reduce((acc, day) => acc + day.completed, 0);
    const monthlyProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
    
    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    const orderedDays = Object.keys(monthlyReportData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    return (
        <ModalWrapper onClose={onClose} isVisible={isVisible} title="Relatórios de Produtividade" size="lg">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-2">
                        <select
                            value={month}
                            onChange={handleMonthChange}
                            className="p-2 border rounded-md"
                        >
                            {months.map((m, index) => (
                                <option key={m} value={index}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={handleYearChange}
                            className="p-2 border rounded-md"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 my-8">Carregando...</p>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-gray-700">Produtividade Mensal ({months[month]} {year})</h3>
                            <div className="flex justify-center items-center my-4">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-green-500 text-2xl font-bold">
                                    {monthlyProgress.toFixed(0)}%
                                </div>
                            </div>
                            <p className="text-gray-600">
                                {totalCompleted} de {totalTasks} tarefas concluídas
                            </p>
                        </div>
                        
                        <div className="bg-gray-100 p-4 rounded-md mb-6 text-center">
                            <h4 className="font-bold text-gray-700">Tempo Total Fora de Foco: <span className="font-normal">{formatDuration(monthlyOffTaskTime)}</span></h4>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                            <ul className="divide-y divide-gray-200">
                                {orderedDays.map(dayKey => {
                                    const dayData = monthlyReportData[dayKey];
                                    const date = dayData.date;
                                    const formattedDay = date.toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                    }).replace(/\./g, '');
                                    
                                    if (dayData.total === 0) return null;
                                    
                                    return (
                                        <li key={dayKey} className="flex items-center justify-between py-2">
                                            <div className="flex items-center space-x-4">
                                                <span className="font-semibold text-gray-800">Dia {date.getDate()}:</span>
                                                <span className="text-sm text-gray-600">{formattedDay}</span>
                                                <span className="text-sm text-gray-600">
                                                    {dayData.completed} de {dayData.total} ({dayData.percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => onOpenDailyReport(date)}
                                                className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </ModalWrapper>
    );
}