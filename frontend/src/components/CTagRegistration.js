import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './CTagRegistration.css';
import Modal from './Modal';

const CTagRegistration = ({ onLogin }) => {
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userCTags, setUserCTags] = useState([]);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/google`, {
        credential: credentialResponse.credential
      });
      onLogin(response.data);
      setUserCTags(response.data.cTags || []);
      setShowModal(true);
    } catch (error) {
      console.error('Error during Google login:', error);
      setError('Login failed. Please try again.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="ctag-registration">
      <GoogleLogin
        onSuccess={handleGoogleLoginSuccess}
        onError={() => setError('Login Failed')}
      />
      {error && <p className="error-message">{error}</p>}
      {showModal && (
        <Modal onClose={closeModal}>
          <h2>Your CTags</h2>
          {userCTags.length > 0 ? (
            <ul>
              {userCTags.map((ctag, index) => (
                <li key={index}>{ctag}</li>
              ))}
            </ul>
          ) : (
            <p>You don't have any CTags yet.</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default CTagRegistration;