import React from 'react';
import Gauge from './Gauge';

const MasterReportDashboard = ({ allUsers, allUsersProductivity, onSelectUser, onBack, onEditCollaborator }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
        }
        return parts[0].charAt(0).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">Relatório Geral de Produtividade</h1>
            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Colaboradores</h2>
                <div className="space-y-4">
                    {allUsers.map(user => {
                        const productivity = allUsersProductivity[user.uid] || { completed: 0, max: 0, percentage: 0 };
                        const name = user.userDetails?.name || user.email;
                        const role = user.userDetails?.role || 'Sem Cargo';

                        return (
                            <div key={user.uid} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-100 rounded-md shadow-sm">
                                <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                                        {getInitials(name)}
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
                                        <p className="text-sm text-gray-600">{role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                    {/* NOVO BOTÃO: Editar Dados */}
                                    <button
                                        onClick={() => onEditCollaborator(user)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors shadow-lg font-semibold text-sm"
                                    >
                                        Editar Dados
                                    </button>
                                    <button
                                        onClick={() => onSelectUser(user)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg font-semibold"
                                    >
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <button
                onClick={onBack}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-lg font-semibold mt-4"
            >
                Voltar
            </button>
        </div>
    );
};

export default MasterReportDashboard;