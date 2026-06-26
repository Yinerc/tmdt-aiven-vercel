'use client';

import React, { useState } from 'react';
import QRPayment from './QRPayment';
import styles from './PaymentSelector.module.css';

interface PaymentSelectorProps {
  orderId: number;
  amount: number;
  onPaymentMethodChange?: (method: string) => void;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

type PaymentMethod = 'cod' | 'bank-transfer' | 'qr' | 'momo' | 'zalo-pay';

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function PaymentSelector({
  orderId,
  amount,
  onPaymentMethodChange,
  onPaymentSuccess,
  onPaymentError
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');

  const paymentMethods: PaymentMethodConfig[] = [
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng',
      description: 'Thanh toán trực tiếp với nhân viên giao hàng',
      icon: '🏠',
      enabled: true
    },
    {
      id: 'qr',
      name: 'Mã QR',
      description: 'Quét mã QR bằng ứng dụng ngân hàng',
      icon: '📱',
      enabled: true
    },
    {
      id: 'bank-transfer',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản trực tiếp vào tài khoản của cửa hàng',
      icon: '🏦',
      enabled: true
    },
    {
      id: 'momo',
      name: 'Ví Momo',
      description: 'Thanh toán qua ứng dụng Momo',
      icon: '💳',
      enabled: false
    },
    {
      id: 'zalo-pay',
      name: 'Zalo Pay',
      description: 'Thanh toán qua ứng dụng Zalo Pay',
      icon: '💰',
      enabled: false
    }
  ];

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    onPaymentMethodChange?.(method);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Chọn phương thức thanh toán</h2>

      <div className={styles.methodsGrid}>
        {paymentMethods.map(method => (
          <button
            key={method.id}
            className={`${styles.methodCard} ${
              selectedMethod === method.id ? styles.active : ''
            } ${!method.enabled ? styles.disabled : ''}`}
            onClick={() => method.enabled && handleMethodChange(method.id)}
            disabled={!method.enabled}
          >
            <div className={styles.icon}>{method.icon}</div>
            <div className={styles.content}>
              <h3>{method.name}</h3>
              <p>{method.description}</p>
            </div>
            {selectedMethod === method.id && (
              <div className={styles.checkmark}>✓</div>
            )}
            {!method.enabled && (
              <div className={styles.comingSoon}>Sắp có</div>
            )}
          </button>
        ))}
      </div>

      <div className={styles.selectedContent}>
        {selectedMethod === 'cod' && (
          <div className={styles.methodInfo}>
            <h3>Thanh toán khi nhận hàng</h3>
            <div className={styles.infoBox}>
              <p>
                ✓ Bạn sẽ thanh toán <strong className={styles.price}>
                  {amount.toLocaleString('vi-VN')} ₫
                </strong> khi nhận hàng
              </p>
              <p>✓ Có thể thanh toán bằng tiền mặt hoặc chuyển khoản</p>
              <p>✓ Không tính phí thanh toán thêm</p>
            </div>
            <button className={styles.confirmBtn} onClick={onPaymentSuccess}>
              Xác nhận đặt hàng
            </button>
          </div>
        )}

        {selectedMethod === 'qr' && (
          <QRPayment
            orderId={orderId}
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
            bankCode="MB"
            accountNumber="1234567890"
          />
        )}

        {selectedMethod === 'bank-transfer' && (
          <div className={styles.methodInfo}>
            <h3>Chuyển khoản ngân hàng</h3>
            <div className={styles.infoBox}>
              <div className={styles.bankDetail}>
                <strong>Tên ngân hàng:</strong> Ngân hàng Quân Đội (MB)
              </div>
              <div className={styles.bankDetail}>
                <strong>Số tài khoản:</strong> 1234567890
              </div>
              <div className={styles.bankDetail}>
                <strong>Chủ tài khoản:</strong> TMDT Store
              </div>
              <div className={styles.bankDetail}>
                <strong>Số tiền:</strong>
                <span className={styles.price}>
                  {amount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className={styles.bankDetail}>
                <strong>Nội dung chuyển khoản:</strong>
                <code>TMDT-ORDER-{orderId}</code>
              </div>
            </div>
            <p className={styles.note}>
              📌 Vui lòng chuyển khoản và ghi lại mã giao dịch.
              Chúng tôi sẽ xác nhận thanh toán trong vòng 15 phút.
            </p>
            <button className={styles.confirmBtn} onClick={() => {
              // Có thể gọi API để ghi nhận đơn hàng
              alert('Vui lòng chuyển khoản theo thông tin trên. Chúng tôi sẽ xác nhận trong 15 phút.');
              onPaymentSuccess?.();
            }}>
              Tôi đã chuyển khoản
            </button>
          </div>
        )}

        {(selectedMethod === 'momo' || selectedMethod === 'zalo-pay') && (
          <div className={styles.comingSoonMessage}>
            <h3>Tính năng sắp có</h3>
            <p>Phương thức thanh toán này đang được phát triển</p>
            <p>Vui lòng chọn phương thức khác để tiếp tục</p>
          </div>
        )}
      </div>

      <div className={styles.orderSummary}>
        <h4>Tóm tắt đơn hàng</h4>
        <div className={styles.summaryRow}>
          <span>Tổng tiền:</span>
          <strong>{amount.toLocaleString('vi-VN')} ₫</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>Phương thức:</span>
          <strong>{paymentMethods.find(m => m.id === selectedMethod)?.name}</strong>
        </div>
      </div>
    </div>
  );
}
