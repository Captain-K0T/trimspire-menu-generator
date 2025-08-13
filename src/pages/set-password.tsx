// src/pages/set-password.tsx

import { useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import styled from 'styled-components';

// Стили можно скопировать из login.tsx, так как они похожи
const PageContainer = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background-color: #f9f9f9;
`;
const Form = styled.form`
  background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; text-align: center;
`;
const Title = styled.h1`
  margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 600;
`;
const Input = styled.input`
  width: 100%; padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: 4px; border: 1px solid #ddd; font-size: 1rem;
`;
const Button = styled.button`
  width: 100%; padding: 0.75rem 1rem; border: none; background-color: #1A202C; color: white; border-radius: 4px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
  &:hover { background-color: #333; }
  &:disabled { background-color: #ccc; cursor: not-allowed; }
`;
const Message = styled.p`
  margin-top: 1rem; font-size: 0.9rem; color: ${props => (props.color === 'error' ? '#d9534f' : '#5cb85c')};
`;

const SetPasswordPage: NextPage = () => {
  const router = useRouter();
  const { token } = router.query; // Получаем токен из URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to set password.');
      }

      // Если пароль успешно установлен, перенаправляем в личный кабинет
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <PageContainer><Message color="error">Invalid or missing token.</Message></PageContainer>
  }

  return (
    <PageContainer>
      <Form onSubmit={handleSubmit}>
        <Title>Create Your Password</Title>
        <Input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <Input
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading || !password || password !== confirmPassword}>
          {loading ? 'Saving...' : 'Set Password and Log In'}
        </Button>
        {error && <Message color="error">{error}</Message>}
      </Form>
    </PageContainer>
  );
};

export default SetPasswordPage;