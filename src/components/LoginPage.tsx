import React, { useState } from 'react';
import { Users, Lock } from 'lucide-react';
import { Logo } from './Logo';
import { getUser } from '../services/mockDatabase';
import { UserProfile } from '../types';

interface LoginPageProps {
    onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailInput) return;
        setLoading(true);
        setLoginError('');
        try {
            const authUser = await getUser(emailInput.trim(), passwordInput);
            if (authUser) {
                onLoginSuccess(authUser);
            } else {
                setLoginError('Access Denied: Invalid Email or Password.');
            }
        } catch (e) {
            setLoginError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo className="h-16" variant="dark" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tertius Integrity AI</h1>
                    <p className="text-slate-500 text-sm mt-1">Secure Field Force Management</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Corporate Email ID</label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="employee@tertius.com"
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                            />
                            <Users size={18} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                            />
                            <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    {loginError && <div className="text-red-600 text-xs bg-red-50 p-3 rounded border border-red-100">{loginError}</div>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Verifying...' : 'Secure Login'}</button>
                </form>
                <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">&copy; 2025 Tertius Integrity AI.</div>
            </div>
        </div>
    );
};
