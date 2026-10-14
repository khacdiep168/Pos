'use client';

import React, { useState } from 'react';
import { formatCurrencyVND } from '@/lib/utils';
import { QrCode, Copy, Check, ShieldCheck, Smartphone } from 'lucide-react';

import { adminService } from '@/services/adminService';

interface VietQRCodeProps {
  amount: number;
  orderId: string;
  tableNumber: string;
}

export const VietQRCode: React.FC<VietQRCodeProps> = ({ amount, orderId, tableNumber }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dynamic Bank Account Information from Store Settings
  const settings = adminService.getSettings();
  const bankId = settings.bank_id || 'MB';
  const bankName = `${bankId} (Ngân hàng TMCP)`;
  const accountNo = settings.bank_account_no || '0901234567';
  const accountName = settings.bank_account_name || settings.store_name || 'VIBE TASTE RESTAURANT';

  // Content for transfer
  const cleanTable = tableNumber.replace(/\s+/g, '');
  const transferContent = `TT ${cleanTable} ${orderId.slice(-6)}`.toUpperCase();

  // Dynamic VietQR Image URL (VietQR Standard API)
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountName)}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3.5">
      <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
        <Smartphone className="w-4 h-4 text-emerald-500" />
        <span>Quét mã VietQR chuyển khoản 24/7</span>
      </div>

      {/* QR Code Container */}
      <div className="relative p-2.5 bg-white rounded-xl shadow-md border border-stone-200/80">
        <img
          src={qrUrl}
          alt={`VietQR ${amount}`}
          className="w-56 h-auto object-contain mx-auto rounded-lg"
          loading="lazy"
        />
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs">
            Khớp tiền tự động
          </span>
        </div>
      </div>

      {/* Transfer Information Breakdown with Copy buttons */}
      <div className="w-full space-y-1.5 text-xs text-left bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800">
        <div className="flex justify-between items-center">
          <span className="text-stone-500">Ngân hàng:</span>
          <span className="font-bold text-stone-900 dark:text-stone-100">{bankName}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-stone-500">Số tài khoản:</span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900 dark:text-stone-100">
            <span>{accountNo}</span>
            <button
              onClick={() => copyToClipboard(accountNo, 'acc')}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600 transition-colors"
              title="Sao chép"
            >
              {copiedField === 'acc' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-stone-500">Chủ tài khoản:</span>
          <span className="font-bold text-stone-900 dark:text-stone-100">{accountName}</span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-stone-100 dark:border-stone-800">
          <span className="text-stone-500">Số tiền:</span>
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <span>{formatCurrencyVND(amount)}</span>
            <button
              onClick={() => copyToClipboard(amount.toString(), 'amount')}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600 transition-colors"
              title="Sao chép"
            >
              {copiedField === 'amount' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-stone-500">Nội dung CK:</span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <span>{transferContent}</span>
            <button
              onClick={() => copyToClipboard(transferContent, 'content')}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600 transition-colors"
              title="Sao chép"
            >
              {copiedField === 'content' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Hệ thống tự động nhận diện và hoàn tất giao dịch sau khi tiền vào tài khoản
      </p>
    </div>
  );
};
