'use client';

import { useRef } from 'react';
import { Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintPdfExportProps {
  title: string;
  children: React.ReactNode;
  onPrint?: () => void;
  onPdfExport?: () => void;
}

export function PrintPdfExport({ title, children, onPrint, onPdfExport }: PrintPdfExportProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: title,
    onAfterPrint: () => {
      onPrint?.();
    },
  });

  const handleExportPdf = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title}.pdf`);
      onPdfExport?.();
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('PDF导出失败，请重试');
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => reactToPrintFn()}
        >
          <Printer className="mr-2 h-4 w-4" />
          打印
        </Button>
        <Button
          variant="outline"
          onClick={handleExportPdf}
        >
          <FileText className="mr-2 h-4 w-4" />
          导出PDF
        </Button>
      </div>
      <div ref={contentRef} className="bg-white">
        {children}
      </div>
    </div>
  );
}

// 单据打印样式组件
export function DocumentPrintLayout({ 
  title, 
  subtitle, 
  children,
  meta
}: { 
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  meta?: Record<string, string>;
}) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
          {Object.entries(meta).map(([key, value]) => (
            <div key={key}>
              <span className="text-sm text-gray-500">{key}：</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="mb-8">
        {children}
      </div>
      
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>打印时间：{new Date().toLocaleString('zh-CN')}</p>
      </div>
    </div>
  );
}
