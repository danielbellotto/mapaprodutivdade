import React from 'react';

const MasterDashboard = ({ allUsers, onSelectUser, onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">Painel de Gerenciamento Master</h1>
            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Escolher Usuário</h2>
                <select
                    onChange={(e) => {
                        const user = allUsers.find(u => u.uid === e.target.value);
                        onSelectUser(user);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    defaultValue=""
                >
                    <option value="" disabled>Selecione um usuário...</option>
                    {allUsers.map(user => (
                        <option key={user.uid} value={user.uid}>{user.email}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={onBack}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-lg font-semibold mt-4"
            >
                Voltar para Meu Perfil
            </button>
        </div>
    );
};

export default MasterDashboard;