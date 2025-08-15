// src/pages/dashboard.tsx

import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { jwtVerify } from 'jose';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
`;

const Title = styled.h1`
  margin-bottom: 2rem;
`;

const LogoutButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #d9534f;
  color: white;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c9302c;
  }
`;

const DashboardPage: NextPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <DashboardContainer>
      <Title>Welcome to your Dashboard!</Title>
      <p>This is a protected page.</p>
      <br />
      <LogoutButton onClick={handleLogout}>Log Out</LogoutButton>
    </DashboardContainer>
  );
};

// --- НАША НОВАЯ "ОХРАНА" ---
export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies['auth_token'];
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  if (!token) {
    // Если cookie нет, перенаправляем на страницу входа
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    // Проверяем токен
    await jwtVerify(token, secret);
    // Если токен валиден, разрешаем показать страницу
    return { props: {} };
  } catch (err) {
    // Если токен невалиден, перенаправляем на страницу входа
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};
// -------------------------

export default DashboardPage;