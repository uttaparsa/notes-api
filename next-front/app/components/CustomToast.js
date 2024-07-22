import React from 'react';
import { Toast } from 'react-bootstrap';

const CustomToast = ({ show, onClose, variant, title, body, delay = 3000 }) => {
  return (
    <Toast 
      onClose={onClose} 
      show={show} 
      delay={delay} 
      autohide
      className={`bg-${variant}`}
    >
      <Toast.Header>
        <strong className="me-auto">{title}</strong>
        <small>Just now</small>
      </Toast.Header>
      <Toast.Body>{body}</Toast.Body>
    </Toast>
  );
};

export default CustomToast;