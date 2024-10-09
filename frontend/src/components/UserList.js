import React from 'react';

const UserList = ({ users }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      {users.map((user) => (
        <div key={user.id} style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <img src={user.avatar} alt={user.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
          <h3>{user.name}</h3>
          <p style={{ color: '#666' }}>{user.username}</p>
        </div>
      ))}
    </div>
  );
};

export default UserList;