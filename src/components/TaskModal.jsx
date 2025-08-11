import React, { useState } from 'react';
import { db, auth } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ModalWrapper } from './ModalWrapper';

export function TaskModal({ onClose, isVisible, categories, viewingUserId }) {
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('');
  const [isDaily, setIsDaily] = useState(true);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isContinuous, setIsContinuous] = useState(true);
  const [numWeeks, setNumWeeks] = useState(1);
  const [turno, setTurno] = useState('qualquer');
  const [priority, setPriority] = useState('importante-urgente');
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = [
    { name: 'Seg', value: 1 },
    { name: 'Ter', value: 2 },
    { name: 'Qua', value: 3 },
    { name: 'Qui', value: 4 },
    { name: 'Sex', value: 5 },
    { name: 'Sáb', value: 6 },
    { name: 'Dom', value: 0 },
  ];

  const handleDayToggle = (dayValue) => {
    setSelectedDays(prevDays =>
      prevDays.includes(dayValue)
        ? prevDays.filter(day => day !== dayValue)
        : [...prevDays, dayValue]
    );
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (taskName.trim() === '') {
      alert("O nome da tarefa não pode ser vazio.");
      return;
    }

    if (!isDaily && selectedDays.length === 0) {
      alert("Por favor, selecione pelo menos um dia da semana para a tarefa.");
      return;
    }

    setIsSaving(true);
    try {
      const taskUserId = viewingUserId || auth.currentUser?.uid;
      if (!taskUserId) {
        alert("Usuário não autenticado.");
        setIsSaving(false);
        return;
      }

      // Usando o timestamp como orderIndex inicial para garantir que a nova tarefa
      // apareça no final por padrão.
      const newOrderIndex = Date.now();

      await addDoc(collection(db, "tasks"), {
        taskName,
        category,
        userId: taskUserId,
        isDaily,
        selectedDays: isDaily ? [] : selectedDays,
        repeatType: isContinuous ? 'continuous' : 'by_weeks',
        numWeeks: isContinuous ? null : numWeeks,
        turno,
        priority,
        completed: false,
        createdAt: serverTimestamp(),
        orderIndex: newOrderIndex, // Adicionando o novo campo
      });
      alert('Tarefa criada com sucesso!');
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar tarefa: ", error);
      alert("Erro ao adicionar tarefa: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title="Cadastrar Nova Tarefa" size="md">
      <form onSubmit={handleSaveTask}>
        <div className="mb-4">
          <label htmlFor="taskName" className="block text-sm font-bold mb-2">Nome da Tarefa</label>
          <input
            type="text"
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-200"
            placeholder="Ex: Impressão de banner 3x1m"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-bold mb-2">Categoria</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-200"
            required
          >
            <option value="" disabled>Selecione uma categoria</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Nova Seção: Matriz de Eisenhower */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Prioridade (Matriz de Eisenhower)</label>
          <div className="grid grid-cols-2 gap-2 text-center">
            <label className={`p-2 rounded-md transition cursor-pointer font-semibold text-sm ${priority === 'importante-urgente' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}>
              <input type="radio" name="priority" value="importante-urgente" checked={priority === 'importante-urgente'} onChange={(e) => setPriority(e.target.value)} className="hidden" />
              Importante e Urgente
            </label>
            <label className={`p-2 rounded-md transition cursor-pointer font-semibold text-sm ${priority === 'importante-nao-urgente' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800'}`}>
              <input type="radio" name="priority" value="importante-nao-urgente" checked={priority === 'importante-nao-urgente'} onChange={(e) => setPriority(e.target.value)} className="hidden" />
              Importante mas Não Urgente
            </label>
            <label className={`p-2 rounded-md transition cursor-pointer font-semibold text-sm ${priority === 'urgente-nao-importante' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
              <input type="radio" name="priority" value="urgente-nao-importante" checked={priority === 'urgente-nao-importante'} onChange={(e) => setPriority(e.target.value)} className="hidden" />
              Urgente mas Não Importante
            </label>
            <label className={`p-2 rounded-md transition cursor-pointer font-semibold text-sm ${priority === 'nao-urgente-nao-importante' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`}>
              <input type="radio" name="priority" value="nao-urgente-nao-importante" checked={priority === 'nao-urgente-nao-importante'} onChange={(e) => setPriority(e.target.value)} className="hidden" />
              Não Urgente e Não Importante
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={isDaily}
              onChange={(e) => {
                setIsDaily(e.target.checked);
                if (e.target.checked) {
                  setSelectedDays([]);
                }
              }}
              className="form-checkbox h-4 w-4 text-green-600"
            />
            <span>Tarefa Diária (Segunda a Sexta)</span>
          </label>
        </div>

        {!isDaily && (
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Dias da Semana</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  className={`px-3 py-1 rounded-md text-sm font-semibold transition ${selectedDays.includes(day.value) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Tipo de Repetição</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="repeatType"
                value="continuous"
                checked={isContinuous}
                onChange={() => setIsContinuous(true)}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Contínua (até exclusão)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="repeatType"
                value="by_weeks"
                checked={!isContinuous}
                onChange={() => setIsContinuous(false)}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Por número de semanas</span>
            </label>
          </div>
        </div>

        {!isContinuous && (
          <div className="mb-4">
            <label htmlFor="numWeeks" className="block text-sm font-bold mb-2">Número de Semanas</label>
            <input
              type="number"
              id="numWeeks"
              value={numWeeks}
              onChange={(e) => setNumWeeks(Number(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-200"
            />
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Turno</label>
          <div className="flex flex-wrap space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="turno"
                value="qualquer"
                checked={turno === 'qualquer'}
                onChange={(e) => setTurno(e.target.value)}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Qualquer Horário</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="turno"
                value="manhã"
                checked={turno === 'manhã'}
                onChange={(e) => setTurno(e.target.value)}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Manhã</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="turno"
                value="tarde"
                checked={turno === 'tarde'}
                onChange={(e) => setTurno(e.target.value)}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Tarde</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="turno"
                value="noite"
                checked={turno === 'noite'}
                onChange={(e) => setTurno(e.target.value)}
                className="form-radio h-4 w-4 text-green-600"
              />
              <span className="ml-2 text-sm">Noite</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 text-white font-semibold rounded-md shadow-md transition ${isSaving ? 'bg-green-300' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isSaving ? 'Salvando...' : 'Salvar Tarefa'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}