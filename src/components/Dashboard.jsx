import React, { useState, useEffect } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from '../utils/firebase';
import { TaskModal } from './TaskModal';
import { CreateCategoryModal } from './CreateCategoryModal';
import { ManageCategoriesModal } from './ManageCategoriesModal';
import { TaskManagementModal } from './TaskManagementModal';
import { ReportModal } from './ReportModal';
import { DailyReportModal } from './DailyReportModal';
import { EditUserModal } from './EditUserModal';
import { EditTaskModal } from './EditTaskModal';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDoc, where, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';

export function Dashboard({ onSwitchToMasterMode, userRole, onLogout, viewingUserId, viewingUserName }) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showTaskManagementModal, setShowTaskManagementModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [selectedDailyReportDate, setSelectedDailyReportDate] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]); // NOVO ESTADO
  const [completedTasks, setCompletedTasks] = useState([]); // NOVO ESTADO
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [monthlyTasks, setMonthlyTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [isSupervisoryMode, setIsSupervisoryMode] = useState(false);
  const [editingPriorityId, setEditingPriorityId] = useState(null);
  const [dailyCompletions, setDailyCompletions] = useState({});

  useEffect(() => {
    if (userRole === 'master' && viewingUserId && viewingUserId !== auth.currentUser.uid) {
      setIsSupervisoryMode(true);
    } else {
      setIsSupervisoryMode(false);
    }
  }, [viewingUserId, userRole]);

  useEffect(() => {
    const fetchUserData = async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserData(user);
        } else {
            setUserData(null);
        }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const categoriesQueryUserId = viewingUserId || auth.currentUser?.uid;
    if (!categoriesQueryUserId) {
        setCategories([]);
        return;
    }
    const qCategories = query(collection(db, "categories"), where("userId", "==", categoriesQueryUserId), orderBy("createdAt"));
    const unsubscribeCategories = onSnapshot(qCategories, (querySnapshot) => {
      const categoriesArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesArray);
    });

    const tasksQueryUserId = viewingUserId || auth.currentUser?.uid;

    if (!tasksQueryUserId) {
      return;
    }

    const qTasks = query(collection(db, "tasks"), where("userId", "==", tasksQueryUserId), orderBy("orderIndex", "asc"));
    const unsubscribeTasks = onSnapshot(qTasks, (querySnapshot) => {
      const allFetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTasks(allFetchedTasks); 

      const currentDayOfWeek = currentDate.getDay(); // 0 (Domingo) a 6 (Sábado)

      const dailyFilteredTasks = allFetchedTasks.filter(task => {
        const taskDayOfWeek = currentDate.getDay();
        
        if (task.isDaily) {
          return taskDayOfWeek >= 1 && taskDayOfWeek <= 5;
        } else {
          return task.selectedDays?.includes(taskDayOfWeek);
        }
      });
      setTasks(dailyFilteredTasks);

      const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
      const lastDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 6);
      
      const weeklyFilteredTasks = allFetchedTasks.filter(task => {
        const taskDate = task.createdAt?.toDate();
        if (!taskDate) return false;
        
        const isCreatedThisWeek = taskDate >= firstDayOfWeek && taskDate <= lastDayOfWeek;
        
        const isRecurringThisWeek = !task.isDaily && task.selectedDays?.some(day => {
          const taskDayDate = new Date(firstDayOfWeek);
          taskDayDate.setDate(taskDayDate.getDate() + day);
          return taskDayDate >= firstDayOfWeek && taskDayDate <= lastDayOfWeek;
        });
        
        return isCreatedThisWeek || isRecurringThisWeek;
      });
      setWeeklyTasks(weeklyFilteredTasks);

      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const monthlyFilteredTasks = allFetchedTasks.filter(task => {
        const taskDate = task.createdAt?.toDate();
        if (!taskDate) return false;
        return taskDate >= firstDayOfMonth && taskDate <= lastDayOfMonth;
      });
      setMonthlyTasks(monthlyFilteredTasks);
    });

    const formattedDateForFetch = currentDate.toISOString().slice(0, 10);
    const completionsQueryUserId = viewingUserId || auth.currentUser?.uid;
    if (completionsQueryUserId) {
        const qCompletions = query(collection(db, "dailyCompletions"), where("userId", "==", completionsQueryUserId), where("completionDate", "==", formattedDateForFetch));
        const unsubscribeCompletions = onSnapshot(qCompletions, (querySnapshot) => {
            const completionsMap = {};
            querySnapshot.docs.forEach(doc => {
                const completionData = doc.data();
                completionsMap[completionData.taskId] = true;
            });
            setDailyCompletions(completionsMap);

            const dailyTasksToFilter = allTasks.filter(task => {
              const taskDayOfWeek = currentDate.getDay();
              if (task.isDaily) {
                return taskDayOfWeek >= 1 && taskDayOfWeek <= 5;
              } else {
                return task.selectedDays?.includes(taskDayOfWeek);
              }
            });
            
            setPendingTasks(dailyTasksToFilter.filter(task => !completionsMap[task.id]));
            setCompletedTasks(dailyTasksToFilter.filter(task => completionsMap[task.id]));
        });
        return () => {
            unsubscribeCompletions();
            unsubscribeTasks();
            unsubscribeCategories();
        };
    }

    return () => {
      unsubscribeCategories();
      unsubscribeTasks();
    };
  }, [currentDate, viewingUserId, allTasks]);

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };
  
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const handleToggleTaskCompletion = async (taskId) => {
    const isCompleted = dailyCompletions[taskId];
    const formattedDate = currentDate.toISOString().slice(0, 10);
    const docId = `${taskId}-${formattedDate}`;
    const taskCompletionRef = doc(db, "dailyCompletions", docId);
    
    try {
      if (isCompleted) {
        await deleteDoc(taskCompletionRef);
      } else {
        await setDoc(taskCompletionRef, {
          taskId,
          userId: viewingUserId || auth.currentUser.uid,
          completionDate: formattedDate,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar o status da tarefa:", error);
      alert("Erro ao atualizar o status da tarefa: " + error.message);
    }
  };

  const handleOpenDailyReport = (date) => {
    setSelectedDailyReportDate(date);
    setShowDailyReportModal(true);
    setShowReportModal(false);
  };
  
  const handleOpenEditTaskModal = (task) => {
    setTaskToEdit(task);
    setShowEditTaskModal(true);
  };
  
  const handleMoveTask = async (taskId, direction) => {
    const taskToMoveList = pendingTasks.find(t => t.id === taskId) ? pendingTasks : completedTasks;
    const currentIndex = taskToMoveList.findIndex(task => task.id === taskId);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === taskToMoveList.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    const taskToMove = taskToMoveList[currentIndex];
    const taskToSwap = taskToMoveList[newIndex];
    
    const batch = writeBatch(db);
    
    const taskToMoveRef = doc(db, "tasks", taskToMove.id);
    const taskToSwapRef = doc(db, "tasks", taskToSwap.id);

    batch.update(taskToMoveRef, { orderIndex: taskToSwap.orderIndex });
    batch.update(taskToSwapRef, { orderIndex: taskToMove.orderIndex });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Erro ao reordenar tarefas:", error);
      alert("Erro ao salvar a nova ordem das tarefas: " + error.message);
    }
  };

  const handleUpdatePriority = async (taskId, newPriority) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { priority: newPriority });
      setEditingPriorityId(null);
    } catch (error) {
      console.error("Erro ao atualizar a prioridade:", error);
      alert("Erro ao atualizar a prioridade: " + error.message);
    }
  };

  const priorities = [
    { value: 'importante-urgente', text: 'Importante e Urgente' },
    { value: 'importante-nao-urgente', text: 'Importante mas Não Urgente' },
    { value: 'urgente-nao-importante', text: 'Urgente mas Não Importante' },
    { value: 'nao-urgente-nao-importante', text: 'Não Urgente e Não Importante' },
  ];

  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    day: 'numeric',
    weekday: 'long',
  }).replace(/\./g, '');
  
  const formattedMonth = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).replace(/^\w/, (c) => c.toUpperCase());

  const totalDailyTasks = pendingTasks.length + completedTasks.length;
  const dailyProgress = totalDailyTasks > 0 ? (completedTasks.length / totalDailyTasks) * 100 : 0;
  const weeklyProgress = weeklyTasks.length > 0 ? (weeklyTasks.filter(t => t.completed).length / weeklyTasks.length) * 100 : 0;
  const monthlyProgress = monthlyTasks.length > 0 ? (monthlyTasks.filter(t => t.completed).length / monthlyTasks.length) * 100 : 0;
  
  const userInfo = isSupervisoryMode ? `Visualizando mapa de: ${viewingUserName}` : (userData?.name ? `${userData?.name || 'Master'} | Setor: ${userData?.sector || 'N/A'} | Função: ${userData?.position || 'N/A'}` : auth.currentUser?.email || 'Usuário');

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
  
  const getCurrentTurno = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'manhã';
    if (hour >= 12 && hour < 18) return 'tarde';
    if (hour >= 18 && hour <= 23) return 'noite';
    return 'qualquer';
  };

  const currentTurno = getCurrentTurno();
  
  const canMarkTask = (task) => {
    const today = new Date();
    const isTaskToday = currentDate.getDate() === today.getDate() &&
                        currentDate.getMonth() === today.getMonth() &&
                        currentDate.getFullYear() === today.getFullYear();
    if (!isTaskToday) {
      return false;
    }
    
    if (task.turno === 'qualquer') {
        return true;
    }
    return task.turno === currentTurno;
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-700">
            Logado como: <span className="font-semibold">{userInfo}</span>
          </div>
          <div className="flex space-x-2">
            {userRole === 'master' && (
              <button
                onClick={onSwitchToMasterMode}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700"
              >
                Painel Master
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </header>
        
        <main>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowEditUserModal(true)}
              className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400"
            >
              Editar Meus Dados
            </button>
          </div>

          {/* Painel de Produtividade */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-6 text-center flex items-center justify-around space-x-4">
            
            {/* Gráfico de Produtividade Semanal */}
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-800 mb-2">
                Semanal
              </h2>
              <div className="flex justify-center items-center my-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-green-500 text-sm font-bold">
                  {Math.round(weeklyProgress)}%
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {weeklyTasks.filter(t => t.completed).length} de {weeklyTasks.length} concluídas
              </p>
            </div>
            
            {/* Gráfico de Produtividade Diária (Central) */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                Produtividade de Hoje ({currentDate.toLocaleDateString('pt-BR')})
              </h2>
              <div className="flex justify-center items-center my-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-green-500 text-2xl font-bold">
                  {Math.round(dailyProgress)}%
                </div>
              </div>
              <p className="text-gray-600">
                {completedTasks.length} de {(pendingTasks.length + completedTasks.length)} tarefas concluídas
              </p>
            </div>
            
            {/* Gráfico de Produtividade Mensal */}
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-800 mb-2">
                Mensal
              </h2>
              <div className="flex justify-center items-center my-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-green-500 text-sm font-bold">
                  {Math.round(monthlyProgress)}%
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {monthlyTasks.filter(t => t.completed).length} de {monthlyTasks.length} concluídas
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowTaskModal(true)}
                className="w-48 bg-green-500 text-white p-3 rounded-md shadow-md font-semibold hover:bg-green-600 transition"
              >
                + Nova Tarefa
              </button>
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="w-48 bg-purple-500 text-white p-3 rounded-md shadow-md font-semibold hover:bg-purple-600 transition"
              >
                + Nova Categoria
              </button>
              <button
                onClick={() => setShowTaskManagementModal(true)}
                className="w-48 bg-blue-500 text-white p-3 rounded-md shadow-md font-semibold hover:bg-blue-600 transition"
              >
                Gerenciar Tarefas
              </button>
              <button
                onClick={() => setShowManageCategoriesModal(true)}
                className="w-48 bg-orange-500 text-white p-3 rounded-md shadow-md font-semibold hover:bg-orange-600 transition"
              >
                Gerenciar Categorias
              </button>
            </div>
          </div>

          {/* Botão de Relatórios Centralizado */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition"
            >
              Ver Relatórios
            </button>
          </div>

          {/* Seletor de Mês e Dia */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handlePreviousMonth}
                className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition"
              >
                Mês Anterior
              </button>
              <span className="text-lg font-bold text-gray-800">
                {formattedMonth}
              </span>
              <button
                onClick={handleNextMonth}
                className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition"
              >
                Próximo Mês
              </button>
            </div>
            <div className="flex justify-center items-center space-x-2 text-lg font-bold">
              <button onClick={handlePreviousDay} className="bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition">
                <span className="text-gray-600">←</span>
              </button>
              <span className="bg-gray-200 p-2 rounded-md text-gray-800">
                {formattedDate}
              </span>
              <button onClick={handleNextDay} className="bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition">
                <span className="text-gray-600">→</span>
              </button>
            </div>
          </div>

          {/* Tabela de Tarefas Pendentes */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tarefas Pendentes ({pendingTasks.length})</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="sticky-header sticky-left bg-white text-left p-2 w-32">CATEGORIA</th>
                  <th className="sticky-header bg-white text-left p-2 w-48">PRIORIDADE</th>
                  <th className="sticky-header bg-white text-center p-2">TAREFA</th>
                  <th className="sticky-header bg-white text-right p-2 w-24">AÇÃO</th>
                  <th className="sticky-header bg-white text-right p-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.length > 0 ? (
                  pendingTasks.map((task, index) => {
                    const categoryData = categories.find(cat => cat.name === task.category);
                    const categoryColor = categoryData?.color || '#D1D5DB';
                    const isButtonDisabled = !canMarkTask(task);
                    
                    return (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td
                          className="p-2 font-semibold text-xs text-white text-center align-middle"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {task.category}
                        </td>
                        <td
                          className={`p-2 text-center text-white font-semibold text-xs align-middle ${getPriorityColor(task.priority)}`}
                          onClick={() => setEditingPriorityId(task.id)}
                        >
                            {editingPriorityId === task.id ? (
                                <div className="absolute z-10 bg-white shadow-md rounded-lg p-2 flex flex-col space-y-1 w-48">
                                    {priorities.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => handleUpdatePriority(task.id, p.value)}
                                            className={`w-full text-center py-1 rounded-md text-sm font-semibold transition ${getPriorityColor(p.value)} text-white`}
                                        >
                                            {p.text}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                getPriorityText(task.priority)
                            )}
                        </td>
                        <td className="p-2 text-center">
                          <p className={`text-lg text-gray-800`}>
                            {task.taskName}
                          </p>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleToggleTaskCompletion(task.id)}
                            disabled={isButtonDisabled}
                            className={`px-3 py-1 rounded-full text-white font-semibold text-xs bg-gray-400 hover:bg-gray-500 ${isButtonDisabled && 'opacity-50 cursor-not-allowed'}`}
                          >
                            Marcar
                          </button>
                        </td>
                        <td className="p-2 text-center space-y-1">
                          <button
                            onClick={() => handleMoveTask(task.id, 'up')}
                            disabled={index === 0}
                            className={`block p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition disabled:opacity-30 disabled:cursor-not-allowed`}
                            title="Mover para cima"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveTask(task.id, 'down')}
                            disabled={index === pendingTasks.length - 1}
                            className={`block p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition disabled:opacity-30 disabled:cursor-not-allowed`}
                            title="Mover para baixo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-500">Nenhuma tarefa pendente para este dia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tabela de Tarefas Concluídas */}
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tarefas Concluídas ({completedTasks.length})</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="sticky-header sticky-left bg-white text-left p-2 w-32">CATEGORIA</th>
                  <th className="sticky-header bg-white text-left p-2 w-48">PRIORIDADE</th>
                  <th className="sticky-header bg-white text-center p-2">TAREFA</th>
                  <th className="sticky-header bg-white text-right p-2 w-24">AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {completedTasks.length > 0 ? (
                  completedTasks.map((task) => {
                    const categoryData = categories.find(cat => cat.name === task.category);
                    const categoryColor = categoryData?.color || '#D1D5DB';

                    return (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td
                          className="p-2 font-semibold text-xs text-white text-center align-middle bg-gray-400"
                          style={{ backgroundColor: 'rgb(156 163 175)' }} // Cor neutra para concluídas
                        >
                          {task.category}
                        </td>
                        <td
                          className={`p-2 text-center text-white font-semibold text-xs align-middle bg-gray-400`}
                          style={{ backgroundColor: 'rgb(156 163 175)' }}
                        >
                          {getPriorityText(task.priority)}
                        </td>
                        <td className="p-2 text-center text-gray-500">
                          <p className={`text-lg line-through`}>
                            {task.taskName}
                          </p>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleToggleTaskCompletion(task.id)}
                            className={`px-3 py-1 rounded-full text-white font-semibold text-xs bg-green-500 hover:bg-green-600`}
                          >
                            Reverter
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500">Nenhuma tarefa concluída para este dia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showTaskModal && <TaskModal isVisible={showTaskModal} onClose={() => setShowTaskModal(false)} categories={categories} viewingUserId={viewingUserId} />}
      {showCreateCategoryModal && <CreateCategoryModal isVisible={showCreateCategoryModal} onClose={() => setShowCreateCategoryModal(false)} viewingUserId={viewingUserId} />}
      {showManageCategoriesModal && <ManageCategoriesModal isVisible={showManageCategoriesModal} onClose={() => setShowManageCategoriesModal(false)} categories={categories} viewingUserId={viewingUserId} />}
      {showTaskManagementModal && <TaskManagementModal 
        isVisible={showTaskManagementModal} 
        onClose={() => setShowTaskManagementModal(false)} 
        onOpenEditTask={handleOpenEditTaskModal}
        viewingUserId={viewingUserId}
      />}
      {showReportModal && <ReportModal isVisible={showReportModal} onClose={() => setShowReportModal(false)} allTasks={allTasks} userData={userData} onOpenDailyReport={handleOpenDailyReport} viewingUserId={viewingUserId} />}
      {showEditUserModal && <EditUserModal isVisible={showEditUserModal} onClose={() => setShowEditUserModal(false)} viewingUserId={viewingUserId} />}
      
      {showDailyReportModal && (
        <DailyReportModal 
          isVisible={showDailyReportModal} 
          onClose={() => {
            setShowDailyReportModal(false);
            setShowReportModal(true);
          }}
          allTasks={allTasks}
          date={selectedDailyReportDate}
          categories={categories}
        />
      )}

      {showEditTaskModal && (
        <EditTaskModal 
          isVisible={showEditTaskModal}
          onClose={() => setShowEditTaskModal(false)}
          taskToEdit={taskToEdit}
          categories={categories}
          viewingUserId={viewingUserId}
        />
      )}

      <footer className="w-full text-center p-4 text-gray-500 text-sm mt-8">
        Criação e Desenvolvimento por Daniel Bellotto e Gemini
      </footer>
    </div>
  );
}