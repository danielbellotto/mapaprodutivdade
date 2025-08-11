import React, { useState, useEffect } from 'react';
import { auth, db } from './utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Dashboard } from './components/Dashboard';
import { MasterPanel } from './components/MasterPanel';
import { Auth } from './components/Auth';
import { MasterAccessModal } from './components/MasterAccessModal';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMasterUser, setIsMasterUser] = useState(false);
  const [showMasterAccessModal, setShowMasterAccessModal] = useState(false);
  const [masterMode, setMasterMode] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [viewingUserName, setViewingUserName] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData(data);
          if (data.role === 'master') {
            setIsMasterUser(true);
            if (masterMode === null) {
              setShowMasterAccessModal(true);
            }
          } else {
            setIsMasterUser(false);
            setMasterMode('normal');
          }
        }
      } else {
        setUserData(null);
        setIsMasterUser(false);
        setMasterMode(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [masterMode]);

  const handleSelectMasterMode = () => {
    setMasterMode('master');
    setShowMasterAccessModal(false);
  };

  const handleSelectNormalMode = () => {
    setMasterMode('normal');
    setShowMasterAccessModal(false);
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMasterMode(null);
      setShowMasterAccessModal(false);
      setViewingUserId(null);
      setViewingUserName(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Erro ao fazer logout: " + error.message);
    }
  };

  const handleViewCollaboratorDashboard = (userId, userName) => {
    setViewingUserId(userId);
    setViewingUserName(userName);
    setMasterMode('normal');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }
  
  const renderApp = () => {
    const currentViewId = isMasterUser && masterMode === 'normal' && viewingUserId ? viewingUserId : user.uid;
    const currentViewName = isMasterUser && masterMode === 'normal' && viewingUserName ? viewingUserName : userData?.name || user.email;

    if (isMasterUser && masterMode === 'master') {
      return (
        <MasterPanel 
          onSwitchToNormalMode={() => {
            setMasterMode('normal');
            setViewingUserId(null);
            setViewingUserName(null);
          }} 
          onLogout={handleLogout} 
          onViewCollaboratorDashboard={handleViewCollaboratorDashboard}
        />
      );
    }
    return (
      <Dashboard 
        onSwitchToMasterMode={() => setMasterMode('master')} 
        userRole={isMasterUser ? 'master' : 'normal'} 
        onLogout={handleLogout}
        viewingUserId={currentViewId}
        viewingUserName={currentViewName}
      />
    );
  }

  return (
    <>
      {showMasterAccessModal && (
        <MasterAccessModal
          isVisible={showMasterAccessModal}
          onSelectMasterMode={handleSelectMasterMode}
          onSelectNormalMode={handleSelectNormalMode}
          onClose={() => setShowMasterAccessModal(false)}
        />
      )}
      {renderApp()}
    </>
  );
}

export default App;