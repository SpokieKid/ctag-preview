import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import CTagRegistration from './components/CTagRegistration';
import UserList from './components/UserList';
import Modal from './components/Modal';

const HomePage = ({ users, onLogout, newCTag }) => {
  const [showModal, setShowModal] = useState(!!newCTag);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div>
      {showModal && (
        <Modal onClose={handleCloseModal}>
          <h2>新的 CTag 已创建</h2>
          <p>我们已为您自动创建了一个新的 CTag: {newCTag}</p>
        </Modal>
      )}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
        <h1>Network School</h1>
        <button onClick={onLogout}>Logout</button>
      </header>
      <main style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input type="text" placeholder="Search..." style={{ width: '100%', padding: '10px' }} />
        </div>
        <UserList users={users} />
      </main>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSelectedCTag, setHasSelectedCTag] = useState(false);
  const [userCTags, setUserCTags] = useState([]);
  const [selectedCTag, setSelectedCTag] = useState(null);
  const [users, _setUsers] = useState([
    { id: 1, name: 'Jonny Bates', username: '@jonnyabates', avatar: 'path_to_avatar_1' },
    { id: 2, name: 'Neter', username: '@neter', avatar: 'path_to_avatar_2' },
  ]);
  const [newCTag, setNewCTag] = useState(null);

  useEffect(() => {
    const checkUserCtags = async () => {
      console.log('Checking user CTags...');
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.googleId) {
          console.log('No user or Google ID found, user might not be logged in');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/ctags/user-ctags/${user.googleId}`);
        const userCtags = response.data;

        console.log('User CTags:', userCtags);
        setUserCTags(userCtags);
        if (userCtags.length > 0) {
          setSelectedCTag(userCtags[0]);
          setHasSelectedCTag(true);
        }
      } catch (error) {
        console.error('Error checking user CTags:', error);
      }
    };

    if (isLoggedIn) {
      checkUserCtags();
    }
  }, [isLoggedIn]);

  const handleLogin = async (userData) => {
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData.user));
    setUserCTags(userData.cTags);
    
    if (userData.cTags.length === 0) {
      // 自动注册新的 CTag
      const newCTag = await registerNewCTag(userData.user.googleId, userData.user.email);
      setNewCTag(newCTag);
    } else {
      setSelectedCTag(userData.cTags[0]);
    }
    setHasSelectedCTag(true);
  };

  const registerNewCTag = async (googleId, email) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/ctags/register`, {
        googleId,
        email
      });
      return response.data.cTag.tag_id;
    } catch (error) {
      console.error('Error registering new CTag:', error);
      return `CTag-${Date.now()}`;
    }
  };

  const handleCTagSelection = (cTag) => {
    setSelectedCTag(cTag);
    setHasSelectedCTag(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHasSelectedCTag(false);
    setUserCTags([]);
    setSelectedCTag(null);
    setNewCTag(null);
    localStorage.removeItem('user');
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={
              !isLoggedIn ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <h1>Welcome to Network School</h1>
                  <CTagRegistration onLogin={handleLogin} />
                </div>
              ) : !hasSelectedCTag ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <h2>Select your CTag</h2>
                  {userCTags.map(cTag => (
                    <button key={cTag} onClick={() => handleCTagSelection(cTag)}>
                      {cTag}
                    </button>
                  ))}
                  {userCTags.length === 0 && <p>No CTags available. A new one has been created for you.</p>}
                  <button onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
                </div>
              ) : (
                <HomePage users={users} onLogout={handleLogout} newCTag={newCTag} />
              )
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;