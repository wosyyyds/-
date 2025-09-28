import React from 'react';

const Message = ({ type, text }) => {
  const style = {
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    backgroundColor: type === 'error' ? '#f8d7da' : '#d4edda',
    color: type === 'error' ? '#721c24' : '#155724',
    border: `1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'}`
  };

  return <div style={style}>{text}</div>;
};

export default Message;