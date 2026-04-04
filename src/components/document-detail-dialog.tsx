'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PrintPdfExport, DocumentPrintLayout } from '@/components/print-pdf-export';

interface DocumentDetailDialogProps {
  title: string;
  documentNo: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  meta?: Record<string, string>;
}

export function DocumentDetailDialog({
  title,
  documentNo,
  trigger,
  children,
  meta,
}: DocumentDetailDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>单号：{documentNo}</DialogDescription>
          </DialogHeader>
          
          <PrintPdfExport title={`${title}-${documentNo}`}>
            <DocumentPrintLayout
              title={title}
              subtitle={`单号：${documentNo}`}
              meta={meta}
            >
              {children}
            </DocumentPrintLayout>
          </PrintPdfExport>
        </DialogContent>
      </Dialog>
    </>
  );
}
