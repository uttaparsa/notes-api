import React from 'react';
import { Button } from 'react-bootstrap';

const SendButton = ({ onClick, uploading, className }) => {
    return (
        <Button 
            type="submit" 
            variant="primary" 
            className={`mr-2 ml-1 ${className || ''}`} 
            disabled={uploading}
            onClick={onClick}
        >
            <svg 
                height="24" 
                viewBox="0 0 48 48" 
                width="24" 
                style={{
                    fill: "var(--bs-body-color)"
                }} 
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M4.02 42l41.98-18-41.98-18-.02 14 30 4-30 4z"/>
                <path d="M0 0h48v48h-48z" fill="none"/>
            </svg>
        </Button>
    );
};

export default SendButton