import React from 'react';
import '../styles/PopupWindow.css';

function PopupWindow({ isOpen, onClose, children }) {
    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="popup-container">
                <button className="close-button" onClick={onClose}>X</button>
                {children}
            </div>
        </div>
    );
}

export default PopupWindow;
