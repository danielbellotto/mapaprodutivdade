import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { db, auth } from '../utils/firebase';
import { collection, addDoc, doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export function TaskTimerModal({ onClose, isVisible, task, viewingUserId, currentDate }) {
  const [timerStatus, setTimerStatus] = useState('stopped'); // 'stopped', 'running', 'paused'
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTimeAtPause, setElapsedTimeAtPause] = useState(0); // NOVO: Tempo decorrido até a pausa
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let interval;
    if (timerStatus === 'running') {
      const startRunningTime = new Date().getTime(); // Momento em que o timer começou a rodar
      interval = setInterval(() => {
        // Atualiza o tempo com base no relógio do sistema, não no intervalo fixo
        const newElapsedTime = Math.floor((new Date().getTime() - startRunningTime) / 1000) + elapsedTimeAtPause;
        setTotalSeconds(newElapsedTime);
      }, 250); // Atualiza a cada 250ms para uma contagem mais fluida na tela
    }
    return () => clearInterval(interval);
  }, [timerStatus, elapsedTimeAtPause]);

  const handleStart = () => {
    if (timerStatus === 'stopped' || timerStatus === 'paused') {
      setSessionStartTime(new Date()); // Usa o relógio do sistema para o início da sessão
      setTimerStatus('running');
    }
  };

  const handlePause = () => {
    setElapsedTimeAtPause(totalSeconds); // Salva o tempo decorrido no momento da pausa
    setTimerStatus('paused');
  };

  const handleFinalize = async () => {
    setIsSaving(true);
    setTimerStatus('stopped');
    const formattedDate = currentDate.toISOString().slice(0, 10);
    const taskSessionsRef = collection(db, "taskSessions");
    
    try {
      if (totalSeconds > 0) {
        await addDoc(taskSessionsRef, {
          userId: viewingUserId || auth.currentUser.uid,
          taskId: task.id,
          taskName: task.taskName,
          duration: totalSeconds,
          startTime: sessionStartTime, // Usando a data do cliente para registro
          endTime: new Date(),
          status: 'finalized',
          completionDate: formattedDate,
        });
      }

      alert('Cronômetro finalizado e tempo salvo com sucesso!');
      onClose();
    } catch (error) {
      console.error("Erro ao finalizar o cronômetro: ", error);
      alert("Erro: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ModalWrapper onClose={onClose} isVisible={isVisible} title={`Cronômetro: ${task?.taskName || 'Tarefa'}`}>
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-5xl font-bold text-gray-800 my-8">
          {formatTime(totalSeconds)}
        </div>
        <div className="flex space-x-4">
          {timerStatus === 'stopped' && (
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-md hover:bg-green-600 transition"
            >
              Start
            </button>
          )}
          {timerStatus === 'running' && (
            <button
              onClick={handlePause}
              className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-full shadow-md hover:bg-yellow-600 transition"
            >
              Pause
            </button>
          )}
          {timerStatus === 'paused' && (
            <>
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-md hover:bg-green-600 transition"
              >
                Continuar
              </button>
              <button
                onClick={handleFinalize}
                disabled={isSaving}
                className={`px-6 py-3 text-white font-semibold rounded-full shadow-md transition ${isSaving ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isSaving ? 'Finalizando...' : 'Finalizar'}
              </button>
            </>
          )}
          {timerStatus === 'running' && (
            <button
              onClick={handleFinalize}
              disabled={isSaving}
              className={`px-6 py-3 text-white font-semibold rounded-full shadow-md transition ${isSaving ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isSaving ? 'Finalizando...' : 'Finalizar'}
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}