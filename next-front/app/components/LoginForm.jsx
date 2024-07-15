"use client"
import UsernameInput from '../components/UsernameInput'; // Adjusted path based on component location
import { useState } from 'react';

const LoginForm = () => {
  const [loginInfo, setLoginInfo] = useState({
    username: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const loginUser = async (event) => {
    console.log('loginUser');
  };

  return (
    <form onSubmit={loginUser}>
      <h4 className="text-right mb-4">ورود به حساب کاربری</h4>
      <div className="form-group">
        <UsernameInput value={loginInfo.username} onChange={(e) => setLoginInfo({ ...loginInfo, username: e.target.value })} />
        <div className="py-2">
          <input
            type="password"
            className="form-control form-control-lg"
            id="password"
            placeholder="گذرواژه"
            value={loginInfo.password}
            onChange={(e) => setLoginInfo({ ...loginInfo, password: e.target.value })}
          />
        </div>
      </div>
      <div className="d-flex w-100">
        <button type="submit" className="btn btn-primary btn-lg w-100">ورود</button>
      </div>
      <div className="d-flex pt-2 pb-0 mb-0">
        <span className="text-danger mt-2">{errorMessage}</span>
      </div>
      <hr />
    </form>
  );
};

export default LoginForm;
