"use client"
import React, { useState } from 'react'; // Import useState for state management

const UsernameInput = ({ modelValue, serverErrors, ...rest }) => {
  const [username, setUsername] = useState(modelValue); // Use state for username

  const handleChange = (event) => {
    setUsername(event.target.value);
    // Emit the update event if needed (replace with your event handling)
    // rest.onChange && rest.onChange(event.target.value);
  };

  return (
    <div>
      <input
        type="text"
        id="username"
        placeholder="enter username"
        value={username}
        onChange={handleChange}
        {...rest} // Pass through any additional props
        className={"form-control form-control-lg" + `${rest.className || ''} ${serverErrors ? 'is-invalid' : ''}`} // Combine classNames
      />
      {serverErrors && (
        <div className="invalid-feedback text-right">{serverErrors}</div>
      )}
    </div>
  );
};

export default UsernameInput;
