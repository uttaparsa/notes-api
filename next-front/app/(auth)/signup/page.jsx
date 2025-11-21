"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '../../lib/auth';
import Link from 'next/link';

export default function SignupPage() {
  const [signupInfo, setSignupInfo] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const signupUser = async (event) => {
    event.preventDefault();
    try {
      await signup(signupInfo.username, signupInfo.email, signupInfo.password);
      router.push('/login');
    } catch (error) {
      console.error('Error signing up:', error);
      setErrorMessage(error.message || 'Signup failed');
    }
  };

  return (
    <form onSubmit={signupUser}>
      <h4 className="text-right mb-4">Create your account</h4>
      <div className="form-group">
        <div className="py-2">
          <input
            type="text"
            className="form-control form-control-lg"
            id="username"
            placeholder="username"
            value={signupInfo.username}
            onChange={(e) => setSignupInfo({ ...signupInfo, username: e.target.value })}
          />
        </div>
        <div className="py-2">
          <input
            type="email"
            className="form-control form-control-lg"
            id="email"
            placeholder="email"
            value={signupInfo.email}
            onChange={(e) => setSignupInfo({ ...signupInfo, email: e.target.value })}
          />
        </div>
        <div className="py-2">
          <input
            type="password"
            className="form-control form-control-lg"
            id="password"
            placeholder="password"
            value={signupInfo.password}
            onChange={(e) => setSignupInfo({ ...signupInfo, password: e.target.value })}
          />
        </div>
      </div>
      <div className="d-flex w-100">
        <button type="submit" className="btn btn-primary btn-lg w-100">sign up</button>
      </div>
      <div className="d-flex pt-2 pb-0 mb-0">
        <span className="text-danger mt-2">{errorMessage}</span>
      </div>
      <hr />
      <div className="text-center">
        <Link href="/login" className="text-decoration-none">
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  );
}
