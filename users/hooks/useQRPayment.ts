'use client';

import { useState, useCallback } from 'react';

interface UseQRPaymentResult {
  qrData: any | null;
  loading: boolean;
  error: string | null;
  status: string;
  generateQR: (orderId: number, amount: number, bankCode?: string, accountNumber?: string) => Promise<any>;
  checkStatus: (qrId: string) => Promise<any>;
  confirmPayment: (qrId: string, transactionId: string, referenceCode: string) => Promise<any>;
  cancelPayment: () => void;
}

/**
 * Hook quản lý thanh toán QR
 */
export function useQRPayment(): UseQRPaymentResult {
  const [qrData, setQrData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('idle');

  const generateQR = useCallback(async (
    orderId: number,
    amount: number,
    bankCode = 'MB',
    accountNumber = '1234567890'
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/qr-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, bankCode, accountNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tạo mã QR');
      }

      setQrData(data.data);
      setStatus('generated');
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tạo mã QR';
      setError(message);
      setStatus('error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (qrId: string) => {
    try {
      const response = await fetch(`/api/payments/qr-verify?qrId=${qrId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi kiểm tra trạng thái');
      }

      if (data.success) {
        setStatus(data.data.status);
        return data.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi kiểm tra trạng thái';
      setError(message);
      throw err;
    }
  }, []);

  const confirmPayment = useCallback(async (
    qrId: string,
    transactionId: string,
    referenceCode: string
  ) => {
    try {
      const response = await fetch('/api/payments/qr-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrId,
          transactionId,
          status: 'SUCCESS',
          referenceCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi xác nhận thanh toán');
      }

      setStatus('success');
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xác nhận thanh toán';
      setError(message);
      setStatus('failed');
      throw err;
    }
  }, []);

  const cancelPayment = useCallback(() => {
    setQrData(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    qrData,
    loading,
    error,
    status,
    generateQR,
    checkStatus,
    confirmPayment,
    cancelPayment
  };
}

/**
 * Hook quản lý danh sách thanh toán
 */
interface UsePaymentListOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export function usePaymentHistory(orderId: number) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/payments/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi lấy lịch sử thanh toán');
      }

      if (data.success) {
        setPayments(data.data.payments);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lấy lịch sử thanh toán';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  return { payments, loading, error, fetchPayments };
}

/**
 * Hook cho admin quản lý thanh toán QR
 */
export function useAdminQRPayments(options: UsePaymentListOptions = {}) {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: options.page || 1,
    limit: options.limit || 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (page = 1, status?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: options.limit?.toString() || '20'
      });

      if (status) params.append('status', status);

      const response = await fetch(`/api/admin/qr-payments?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi lấy danh sách');
      }

      if (data.success) {
        setItems(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lấy danh sách';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [options.limit]);

  const updateStatus = useCallback(async (qrId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/qr-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId, status: newStatus, notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật trạng thái');
      }

      // Cập nhật danh sách
      setItems(items.map(item =>
        item.id === qrId ? { ...item, trang_thai: newStatus } : item
      ));

      return data.data;
    } catch (err) {
      throw err;
    }
  }, [items]);

  return {
    items,
    pagination,
    loading,
    error,
    fetchPayments,
    updateStatus
  };
}
