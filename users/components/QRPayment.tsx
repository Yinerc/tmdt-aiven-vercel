'use client';

import React, { useState, useEffect } from 'react';
import styles from './QRPayment.module.css';

interface QRPaymentProps {
  orderId: number;
  amount: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  bankCode?: string;
  accountNumber?: string;
}

export default function QRPayment({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  bankCode = 'MB',
  accountNumber = '1234567890'
}: QRPaymentProps) {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [showDetails, setShowDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 phút

  // Tạo QR code
  const generateQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/qr-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          bankCode,
          accountNumber,
          amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tạo mã QR');
      }

      setQrData(data.data);
      setStatus('generated');
      setTimeRemaining(900);
      pollPaymentStatus(data.data.qrId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tạo mã QR';
      setError(message);
      setStatus('error');
      onPaymentError?.(message);
    } finally {
      setLoading(false);
    }
  };

  // Poll trạng thái thanh toán
  const pollPaymentStatus = async (qrId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/qr-verify?qrId=${qrId}`);
        const data = await response.json();

        if (data.success && data.data) {
          const qr = data.data;

          if (qr.status === 'da_nhan_tien') {
            setStatus('success');
            clearInterval(pollInterval);
            onPaymentSuccess?.();
          } else if (qr.status === 'that_bai' || qr.isExpired) {
            setStatus('failed');
            setError(qr.isExpired ? 'Mã QR đã hết hạn' : 'Thanh toán thất bại');
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  };

  // Countdown timer
  useEffect(() => {
    if (status !== 'generated') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Thanh toán bằng mã QR</h3>

      {error && (
        <div className={styles.error}>
          <span>❌ {error}</span>
        </div>
      )}

      {status === 'idle' && (
        <button
          className={styles.generateBtn}
          onClick={generateQR}
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo mã QR'}
        </button>
      )}

      {status === 'generated' && qrData && (
        <div className={styles.qrContainer}>
          <div className={styles.qrImage}>
            <img src={qrData.vietQRUrl} alt="QR Code" />
          </div>

          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Số tiền:</span>
              <span className={styles.value}>
                {(qrData.amount).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Thời hạn:</span>
              <span className={styles.value + ' ' + (timeRemaining < 60 ? styles.warning : '')}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Mã đơn hàng:</span>
              <span className={styles.value}>{qrData.qrCodeData}</span>
            </div>

            <button
              className={styles.detailsBtn}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ẩn' : 'Hiện'} chi tiết
            </button>

            {showDetails && (
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <strong>Ngân hàng:</strong> {qrData.bankCode}
                </div>
                <div className={styles.detailItem}>
                  <strong>Số tài khoản:</strong>
                  <div className={styles.accountInfo}>
                    {qrData.accountNumber}
                    <button
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(qrData.accountNumber)}
                      title="Sao chép"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <strong>Nội dung chuyển khoản:</strong>
                  <div className={styles.accountInfo}>
                    {qrData.qrCodeData}
                    <button
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(qrData.qrCodeData)}
                      title="Sao chép"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className={styles.instruction}>
              📱 Vui lòng quét mã QR bằng ứng dụng ngân hàng hoặc ứng dụng thanh toán có hỗ trợ VietQR
            </p>

            <div className={styles.status}>
              <div className={styles.spinner} />
              <span>Đang chờ thanh toán...</span>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className={styles.success}>
          <div className={styles.icon}>✅</div>
          <h4>Thanh toán thành công!</h4>
          <p>Đơn hàng của bạn đã được xác nhận</p>
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.failed}>
          <div className={styles.icon}>❌</div>
          <h4>Thanh toán thất bại</h4>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={generateQR}>
            Thử lại
          </button>
        </div>
      )}

      {status === 'expired' && (
        <div className={styles.expired}>
          <div className={styles.icon}>⏰</div>
          <h4>Mã QR đã hết hạn</h4>
          <p>Vui lòng tạo mã QR mới để tiếp tục thanh toán</p>
          <button className={styles.retryBtn} onClick={generateQR}>
            Tạo mã QR mới
          </button>
        </div>
      )}
    </div>
  );
}
