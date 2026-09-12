import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'البنية الاساسية للمقاولات | إدارة طلبات الموارد البشرية', description: 'نظام إنشاء وتحليل طلبات التوظيف والتدريب والتجربة والتقييم' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }