import React, { useState } from 'react';
import { auth, db } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            let userCredential;
            if (isLoginMode) {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: name,
                    email: userCredential.user.email,
                    role: 'normal',
                    sector: 'N/A',
                    position: 'N/A',
                    createdAt: serverTimestamp(),
                });
            }
        } catch (err) {
            console.error("Erro na autenticação:", err);
            if (isLoginMode) {
                setError("E-mail ou senha inválidos. Por favor, tente novamente.");
            } else {
                setError("Ocorreu um erro no cadastro. Tente com um e-mail diferente.");
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
      if (!email) {
        setError("Por favor, digite seu e-mail para redefinir a senha.");
        return;
      }
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        await sendPasswordResetEmail(auth, email);
        setMessage("Um e-mail para redefinir sua senha foi enviado. Por favor, verifique sua caixa de entrada.");
      } catch (err) {
        console.error("Erro ao redefinir a senha:", err);
        setError("Ocorreu um erro ao enviar o e-mail. Verifique se o e-mail está correto.");
      } finally {
        setLoading(false);
      }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    {isLoginMode ? 'Login' : 'Cadastre-se'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLoginMode && (
                        <input
                            type="text"
                            placeholder="Nome Completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 text-white font-bold bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? (isLoginMode ? 'Entrando...' : 'Cadastrando...') : (isLoginMode ? 'Entrar' : 'Cadastrar')}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                </form>
                {isLoginMode && (
                  <div className="text-center">
                    <button onClick={handlePasswordReset} className="text-sm text-indigo-600 hover:underline disabled:opacity-50" disabled={loading}>
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
                <div className="text-center">
                    <button
                        onClick={() => {
                          setIsLoginMode(!isLoginMode);
                          setError(null);
                          setMessage(null);
                        }}
                        className="text-indigo-600 hover:underline"
                    >
                        {isLoginMode ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                    </button>
                </div>
            </div>
        </div>
    );
}