import React from 'react';
import { Button } from 'react-bootstrap';

const DecreaseImportanceButton = ({ onClick, variant = "outline-primary", className = "", width = '20px', height = '20px' }) => {
    return (
        <Button
            variant={variant}
            className={className}
            onClick={onClick}
        >
            <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                height={height}
                viewBox="0 0 1000 1000"
                width={width}
                style={{ fill: "var(--bs-primary)" }}
            >
                <g>
                    <path d="M500,900 L100,500 L300,500 L300,100 L700,100 L700,500 L900,500 Z"/>
                </g>
            </svg>
        </Button>
    );
};

export default DecreaseImportanceButton;
