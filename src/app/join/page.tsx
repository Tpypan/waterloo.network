'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [code, setCode] = useState('');
    const router = useRouter();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'send' }),
            });
            if (res.ok) {
                setStep('code');
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, action: 'verify' }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard?token=${data.token}`);
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {step === 'email' ? (
                <form onSubmit={handleEmailSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>what is your uwaterloo email address?</h1>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="j1doe@uwaterloo.ca"
                        className="input-field"
                        style={{
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                            textAlign: 'center',
                            width: '100%',
                            fontSize: '1.5rem',
                            color: 'var(--foreground)'
                        }}
                        required
                        autoFocus
                        disabled={loading}
                    />
                    <div style={{ width: '100%', maxWidth: '400px', height: '4px', background: '#000', marginTop: '1rem' }}></div>
                    {loading && <p>sending...</p>}
                    {error && <p style={{ color: 'red' }}>something went wrong. try again.</p>}
                </form>
            ) : (
                <form onSubmit={handleCodeSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>we sent you a code :)</h1>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        className="input-field"
                        style={{ 
                            letterSpacing: '0.5em', 
                            fontSize: '2rem',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            background: 'transparent',
                            textAlign: 'center',
                            width: '100%',
                            color: 'var(--foreground)'
                        }}
                        required
                        autoFocus
                        disabled={loading}
                    />
                    <div style={{ width: '100%', maxWidth: '400px', height: '4px', background: '#000', marginTop: '1rem' }}></div>
                    {loading && <p>verifying...</p>}
                    {error && <p style={{ color: 'red' }}>invalid code. try again.</p>}
                </form>
            )}
        </div>
    );
}
