import React, { useState, useEffect } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, query, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { EditUserModal } from './EditUserModal';

export function MasterPanel({ onSwitchToNormalMode, onLogout, onViewCollaboratorDashboard }) {
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null); // NOVO: Estado para a função do usuário logado

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUserRole(userDoc.data().role);
        }
      }
    };

    const qUsers = query(collection(db, "users"), orderBy("createdAt"));
    const unsubscribeUsers = onSnapshot(qUsers, async (querySnapshot) => {
      const usersArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const usersWithDetails = await Promise.all(usersArray.map(async (user) => {
        const userDetailsRef = doc(db, "users", user.id);
        const userDetailsSnap = await getDoc(userDetailsRef);
        return {
          ...user,
          userDetails: userDetailsSnap.exists() ? userDetailsSnap.data() : {},
        };
      }));

      setUsers(usersWithDetails);
    });

    const qTasks = query(collection(db, "tasks"));
    const unsubscribeTasks = onSnapshot(qTasks, (querySnapshot) => {
      const tasksArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTasks(tasksArray);
      setLoading(false);
    });

    fetchCurrentUserRole(); // NOVO: Busca a função do usuário logado

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, []);

  const calculateProductivity = (userTasks, date) => {
    const today = date;
    const currentDayOfWeek = today.getDay();
    
    const dailyTasks = userTasks.filter(task => {
        if (task.isDaily) {
          return currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
        } else {
          const taskDate = task.createdAt?.toDate();
          const isCreatedOnCurrentDate = taskDate &&
                                         taskDate.getDate() === today.getDate() &&
                                         taskDate.getMonth() === today.getMonth() &&
                                         taskDate.getFullYear() === today.getFullYear();
          const isRecurringOnSelectedDay = task.selectedDays?.includes(currentDayOfWeek);
          return isCreatedOnCurrentDate || isRecurringOnSelectedDay;
        }
    });

    const completedDailyTasks = dailyTasks.filter(t => t.completed);
    const dailyProgress = dailyTasks.length > 0 ? (completedDailyTasks.length / dailyTasks.length) * 100 : 0;
    
    const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const lastDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const weeklyTasks = userTasks.filter(task => {
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

    const monthlyTasks = userTasks.filter(task => {
        const taskDate = task.createdAt?.toDate();
        if (!taskDate) return false;
        return taskDate >= firstDayOfMonth && taskDate <= lastDayOfMonth;
    });
    
    const weeklyProgress = weeklyTasks.length > 0 ? (weeklyTasks.filter(t => t.completed).length / weeklyTasks.length) * 100 : 0;
    const monthlyProgress = monthlyTasks.length > 0 ? (monthlyTasks.filter(t => t.completed).length / monthlyTasks.length) * 100 : 0;

    return {
        daily: dailyProgress.toFixed(0),
        weekly: weeklyProgress.toFixed(0),
        monthly: monthlyProgress.toFixed(0),
        dailyTasks: dailyTasks
    };
  };

  const handleToggleDetails = (userId) => {
    setExpandedUserId(prevId => (prevId === userId ? null : userId));
  };
  
  const handleOpenEditUserModal = (user) => {
    setUserToEdit(user);
    setShowEditUserModal(true);
  };

  const handleCloseEditUserModal = () => {
    setShowEditUserModal(false);
    setUserToEdit(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-700">
            Modo: <span className="font-semibold text-purple-600">Gerenciamento Master</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onSwitchToNormalMode}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700"
            >
              Voltar ao Modo Normal
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </header>

        <main>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">Lista de Usuários</h2>
            {loading ? (
              <p className="text-center text-gray-500">Carregando usuários...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cargo/Setor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produtividade (D/S/M)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => {
                      const userTasks = allTasks.filter(task => task.userId === user.id);
                      const productivity = calculateProductivity(userTasks, new Date());
                      const isExpanded = expandedUserId === user.id;

                      const completedTasks = productivity.dailyTasks.filter(t => t.completed);
                      const pendingTasks = productivity.dailyTasks.filter(t => !t.completed);
                      
                      return (
                        <React.Fragment key={user.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.position} | {user.sector}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {productivity.daily}% | {productivity.weekly}% | {productivity.monthly}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              {/* NOVO BOTÃO: Editar Dados */}
                              <button
                                onClick={() => handleOpenEditUserModal(user)}
                                className="text-gray-600 hover:text-gray-900 font-semibold"
                              >
                                Editar Dados
                              </button>
                              <button
                                onClick={() => handleToggleDetails(user.id)}
                                className="text-indigo-600 hover:text-indigo-900 font-semibold"
                              >
                                {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                              </button>
                              <button
                                onClick={() => onViewCollaboratorDashboard(user.id, user.name)}
                                className="text-indigo-600 hover:text-indigo-900 font-semibold"
                              >
                                Mapa Colaborador
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-100">
                              <td colSpan="4" className="p-4">
                                <div className="p-4 bg-white rounded-md shadow-inner">
                                  <h4 className="font-bold mb-2">Detalhes Diários - {user.name}</h4>
                                  
                                  {pendingTasks.length > 0 && (
                                    <div className="mb-4">
                                      <h5 className="font-semibold text-red-600 mb-2">Pendentes ({pendingTasks.length})</h5>
                                      <ul className="list-disc list-inside space-y-1">
                                        {pendingTasks.map(task => (
                                          <li key={task.id} className="text-sm text-gray-700">
                                            {task.taskName}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {completedTasks.length > 0 && (
                                    <div>
                                      <h5 className="font-semibold text-green-600 mb-2">Concluídas ({completedTasks.length})</h5>
                                      <ul className="list-disc list-inside space-y-1">
                                        {completedTasks.map(task => (
                                          <li key={task.id} className="text-sm text-gray-700">
                                            {task.taskName}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {pendingTasks.length === 0 && completedTasks.length === 0 && (
                                    <p className="text-sm text-gray-500">Nenhuma tarefa encontrada para este dia.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {showEditUserModal && userToEdit && (
        <EditUserModal 
          isVisible={showEditUserModal}
          onClose={handleCloseEditUserModal}
          viewingUserId={userToEdit.id}
          userRole={currentUserRole} // NOVO: Passa a função do usuário logado
        />
      )}
    </div>
  );
}