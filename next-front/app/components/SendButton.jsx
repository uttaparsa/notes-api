import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const SendButton = ({ onClick, uploading, loading, className }) => {
    return (
        <Button 
            type="submit" 
            variant="primary" 
            className={`mr-2 ml-1 ${className || ''}`} 
            disabled={uploading || loading}
            onClick={onClick}
            id="send-button"
        >
            {loading ? (
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    style={{ width: '16px', height: '16px' }}
                />
            ) : (
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
            )}
        </Button>
    );
};

export default SendButton