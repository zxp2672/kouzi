import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import WarehouseLayout from '@/components/warehouse-layout';

export const metadata: Metadata = {
  title: {
    default: '库房管理系统',
    template: '%s | 库房管理系统',
  },
  description: '专业的库房管理系统，支持商品入库、出库、盘点、调拨、审核等功能',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {isDev && <Inspector />}
        <WarehouseLayout>{children}</WarehouseLayout>
      </body>
    </html>
  );
}
