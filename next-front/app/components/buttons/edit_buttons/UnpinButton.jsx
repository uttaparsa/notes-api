import React from 'react';
import { Button } from 'react-bootstrap';

const UnpinButton = ({ onClick, variant = "outline-primary", className = "" }) => {
    return (
        <Button
            variant={variant}
            className={className}
            onClick={onClick}
        >
            <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 1000 1000"
                width="24px"
                style={{ fill: "var(--bs-primary)" }}
            >
                <g>
                    <path d="M44.177,220.307l363.9,296.4c22.101,18,48.9,27,75.8,27c26.901,0,53.701-9,75.801-27l366.699-298.7
                        c51.4-41.9,59.101-117.4,17.2-168.8c-41.8-51.4-117.399-59.1-168.8-17.3l-290.901,237l-288.1-234.7c-51.4-41.8-127-34.1-168.8,17.3
                        C-14.923,102.907-7.123,178.407,44.177,220.307z"/>
                    <path d="M44.177,642.207l363.9,296.399c22.101,18,48.9,27,75.8,27c26.901,0,53.701-9,75.801-27l366.699-298.7
                        c51.4-41.899,59.101-117.399,17.2-168.8c-41.899-51.399-117.399-59.1-168.8-17.2l-290.901,236.9l-288.1-234.6
                        c-51.4-41.9-127-34.101-168.8,17.199C-14.923,524.807-7.123,600.406,44.177,642.207z"/>
                </g>
            </svg>
        </Button>
    );
};

export default UnpinButton;
