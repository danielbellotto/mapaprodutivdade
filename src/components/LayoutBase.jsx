import React from 'react';

const LayoutBase = ({ children, user, isMaster, selectedUser, userDetails, handleSignOut, setIsEditingDetails, setViewMode, setSelectedUser }) => {
    return (
        <div className="min-h-screen bg-gray-50 font-inter p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">
                {isMaster && selectedUser ? `Mapa de Produtividade de ${selectedUser.userDetails?.name || selectedUser.email}` : `Mapa de Produtividade Imprecom`}
            </h1>
            {user && (
                <div className="w-full max-w-4xl flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                        {isMaster && selectedUser ? (
                            <span>Visualizando: <span className="font-mono bg-gray-200 px-2 py-1 rounded-md text-xs">{selectedUser.userDetails?.name || selectedUser.email}</span></span>
                        ) : (
                            <span>Logado como: <span className="font-mono bg-gray-200 px-2 py-1 rounded-md text-xs">{userDetails.name || user.email || user.uid}</span></span>
                        )}
                    </p>
                    <div className="flex space-x-2">
                        {isMaster && (
                            <button
                                onClick={() => {
                                    setSelectedUser(null);
                                    setViewMode('master_select');
                                }}
                                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors shadow-sm text-sm"
                            >
                                Painel Master
                            </button>
                        )}
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm text-sm"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            )}
            <div className="w-full max-w-4xl flex justify-end items-center mb-4">
                <button
                    onClick={() => setIsEditingDetails(true)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-sm text-sm"
                >
                    Editar Meus Dados
                </button>
            </div>
            {children}
        </div>
    );
};

export default LayoutBase;