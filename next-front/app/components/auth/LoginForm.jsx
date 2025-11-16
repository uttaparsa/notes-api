"use client"
import UsernameInput from '../UsernameInput'; // Adjusted path based on component location
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/auth';


const LoginForm = () => {
  const [loginInfo, setLoginInfo] = useState({
    username: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const loginUser = async (event) => {
    console.log('loginUser');
    event.preventDefault();
    try {
      const data = await login(loginInfo.username, loginInfo.password);

      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      router.push('/');
    } catch (error) {
      console.error('Error logging in:', error);
      setErrorMessage('Invalid login');
      return
      
    }

  };

  return (
    <form onSubmit={loginUser}>
      <h4 className="text-right mb-4">Login to your acccount</h4>
      <div className="form-group">
        <UsernameInput value={loginInfo.username} onChange={(e) => setLoginInfo({ ...loginInfo, username: e.target.value })} />
        <div className="py-2">
          <input
            type="password"
            className="form-control form-control-lg"
            id="password"
            placeholder="pw"
            value={loginInfo.password}
            onChange={(e) => setLoginInfo({ ...loginInfo, password: e.target.value })}
          />
        </div>
      </div>
      <div className="d-flex w-100">
        <button type="submit" className="btn btn-primary btn-lg w-100">sign in</button>
      </div>
      <div className="d-flex pt-2 pb-0 mb-0">
        <span className="text-danger mt-2">{errorMessage}</span>
      </div>
      <hr />
    </form>
  );
};

export default LoginForm;
