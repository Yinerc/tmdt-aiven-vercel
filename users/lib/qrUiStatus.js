function deriveQrUiStatus(apiData) {
  const status = apiData?.status || apiData?.data?.status;
  const isExpired = apiData?.isExpired || apiData?.data?.isExpired;

  if (status === 'da_nhan_tien') {
    return {
      isSuccess: true,
      message: 'Thanh toán đã được xác nhận',
      canConfirm: true,
    };
  }

  if (status === 'that_bai' || isExpired) {
    return {
      isSuccess: false,
      message: isExpired ? 'Mã QR đã hết hạn' : 'Thanh toán thất bại',
      canConfirm: false,
    };
  }

  return {
    isSuccess: false,
    message: 'Đang chờ thanh toán...',
    canConfirm: false,
  };
}

module.exports = {
  deriveQrUiStatus,
};
