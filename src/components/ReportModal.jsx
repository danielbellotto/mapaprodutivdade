import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';

export function ReportModal({ onClose, isVisible, allTasks, userData, onOpenDailyReport, viewingUserId, size }) {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthlyReportData, setMonthlyReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        if (!isVisible || !viewingUserId) return;

        const fetchMonthlyData = async () => {
            setLoading(true);
            
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);

            const qCompletions = query(
                collection(db, "dailyCompletions"),
                where("userId", "==", viewingUserId),
                where("completionTimestamp", ">=", firstDayOfMonth),
                where("completionTimestamp", "<=", lastDayOfMonth)
            );
            
            try {
                const querySnapshot = await getDocs(qCompletions);
                const completionsMap = {};
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const dateKey = data.completionDate;
                    if (!completionsMap[dateKey]) {
                        completionsMap[dateKey] = [];
                    }
                    completionsMap[dateKey].push(data);
                });

                const monthlyTasks = allTasks.filter(task => {
                    const taskDate = task.createdAt?.toDate();
                    if (!taskDate) return false;
                    return taskDate >= firstDayOfMonth && taskDate <= lastDayOfMonth;
                });
                
                const report = [];
                const daysInMonth = lastDayOfMonth.getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const formattedDay = new Date(year, month, day).toISOString().slice(0, 10);
                    const dailyCompletions = completionsMap[formattedDay] || [];
                    const dailyTasks = monthlyTasks.filter(task => {
                        const taskDate = task.createdAt?.toDate();
                        if (task.isDaily) {
                            return new Date(year, month, day).getDay() >= 1 && new Date(year, month, day).getDay() <= 5;
                        }
                        return task.selectedDays?.includes(new Date(year, month, day).getDay());
                    });
                    
                    const completed = dailyCompletions.length;
                    const total = dailyTasks.length;

                    report.push({
                        day,
                        completed,
                        total,
                        percentage: total > 0 ? (completed / total) * 100 : 0,
                    });
                }

                setMonthlyReportData(report);

            } catch (error) {
                console.error("Erro ao buscar dados do relatório:", error);
                alert("Erro ao buscar dados do relatório: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyData();
    }, [isVisible, month, year, viewingUserId, allTasks]);

    const monthlyTotalTasks = monthlyReportData.reduce((acc, curr) => acc + curr.total, 0);
    const monthlyCompletedTasks = monthlyReportData.reduce((acc, curr) => acc + curr.completed, 0);
    const monthlyProgress = monthlyTotalTasks > 0 ? (monthlyCompletedTasks / monthlyTotalTasks) * 100 : 0;

    return (
        <ModalWrapper onClose={onClose} isVisible={isVisible} title="Relatórios de Produtividade" size={size}>
            <div className="flex space-x-4 mb-6">
                <select 
                    value={month} 
                    onChange={(e) => setMonth(Number(e.target.value))} 
                    className="flex-1 p-2 border rounded-md"
                >
                    {months.map((m, index) => (
                        <option key={index} value={index}>{m}</option>
                    ))}
                </select>
                <select 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))} 
                    className="flex-1 p-2 border rounded-md"
                >
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
            
            <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-2">Produtividade Mensal ({months[month]} {year})</h3>
                <div className="flex justify-center items-center my-4">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-green-500 text-2xl font-bold">
                        {Math.round(monthlyProgress)}%
                    </div>
                </div>
                <p className="text-gray-600">
                    {monthlyCompletedTasks} de {monthlyTotalTasks} tarefas concluídas
                </p>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                {loading ? (
                    <p className="text-center text-gray-500 py-4">Carregando relatório...</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {monthlyReportData.map(dayData => (
                            <li key={dayData.day} className="flex items-center justify-between py-2 hover:bg-gray-50">
                                <span className="font-semibold text-gray-800">
                                    Dia {dayData.day}:
                                </span>
                                <span className="text-gray-600">
                                    {dayData.completed} de {dayData.total} ({Math.round(dayData.percentage)}%)
                                </span>
                                <button
                                    onClick={() => onOpenDailyReport(new Date(year, month, dayData.day))}
                                    className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
                                >
                                    Ver Detalhes
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </ModalWrapper>
    );
}