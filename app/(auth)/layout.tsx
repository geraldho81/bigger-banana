import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in - Bigger Banana',
  description: 'Access Bigger Banana with your account.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg-primary">{children}</div>;
}
