"use client"
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState('confirming');
  const [message, setMessage] = useState('');
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/confirm-email/${params.token}/`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Confirmation failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during confirmation');
      }
    };

    if (params.token) {
      confirmEmail();
    }
  }, [params.token, router]);

  return (
    <div className="text-center">
      <h4 className="mb-4">Email Confirmation</h4>
      
      {status === 'confirming' && (
        <div>
          <p>Confirming your email...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-success">
          <p>{message}</p>
          <p>Redirecting to login...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-danger">
          <p>{message}</p>
          <Link href="/login" className="btn btn-primary mt-3">
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}
