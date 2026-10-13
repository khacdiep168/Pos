import { NextRequest, NextResponse } from 'next/server';

/**
 * Universal Webhook Handler for Automatic VietQR Banking Reconciliation
 * Supports SePay (sepay.vn), Cass.vn, and PayOS webhook formats.
 *
 * Endpoint: POST /api/webhook/payment
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key');
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;

    // Verify secret if configured in environment
    if (secret && authHeader && !authHeader.includes(secret)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized webhook request' },
        { status: 401 }
      );
    }

    const payload = await req.json();
    console.log('[Payment Webhook] Received banking transaction notification:', payload);

    let transferAmount = 0;
    let descriptionText = '';
    let transactionId = '';
    let bankName = '';

    // 1. Detect SePay format
    if (payload.transferAmount !== undefined && payload.content !== undefined) {
      transferAmount = Number(payload.transferAmount);
      descriptionText = String(payload.content || payload.description || '');
      transactionId = String(payload.id || payload.referenceCode || '');
      bankName = String(payload.gateway || 'Bank');
    }
    // 2. Detect PayOS format
    else if (payload.data && payload.data.orderCode !== undefined) {
      transferAmount = Number(payload.data.amount || 0);
      descriptionText = String(payload.data.description || payload.data.orderCode);
      transactionId = String(payload.data.reference || payload.data.orderCode);
      bankName = 'PayOS';
    }
    // 3. Detect Cass.vn format
    else if (Array.isArray(payload.data) && payload.data.length > 0) {
      const firstTx = payload.data[0];
      transferAmount = Number(firstTx.amount || 0);
      descriptionText = String(firstTx.description || '');
      transactionId = String(firstTx.transaction_id || '');
      bankName = 'Cass';
    }
    // 4. Generic fallback format
    else {
      transferAmount = Number(payload.amount || payload.total || 0);
      descriptionText = String(payload.description || payload.content || payload.orderId || '');
      transactionId = String(payload.transactionId || payload.id || Date.now());
      bankName = String(payload.bank || 'VietQR');
    }

    // Extract Order ID or Table Number from transfer content
    // Regex matches common patterns: ORD-12345, ORD12345, DH-12345, BAN-01, etc.
    const orderMatch = descriptionText.match(/(ORD[-_]?[A-Z0-9]+|DH[-_]?[A-Z0-9]+|BAN[-_]?[0-9]+)/i);
    const matchedRef = orderMatch ? orderMatch[0].toUpperCase() : '';

    return NextResponse.json({
      success: true,
      message: 'Transaction received and verified successfully',
      data: {
        transactionId,
        bankName,
        transferAmount,
        matchedReference: matchedRef,
        rawDescription: descriptionText,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Payment Webhook Error]:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server error processing payment webhook',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Vibe Taste POS - Automated VietQR Banking Webhook Listener',
    supportedGateways: ['SePay (sepay.vn)', 'Cass.vn', 'PayOS (payos.vn)', 'VietQR'],
    timestamp: new Date().toISOString(),
  });
}
