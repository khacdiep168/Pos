'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import { adminService } from '@/services/adminService';
import { orderService } from '@/services/orderService';
import {
  Store,
  Save,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Percent,
  Wifi,
  Image,
  CreditCard,
  Building,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  Scale,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  Volume2,
  VolumeX,
  Mic,
  Radio,
  Activity,
  Play,
  Cpu,
} from 'lucide-react';
import { voiceNotificationService, VIENEU_PRESET_VOICES } from '@/services/voiceNotificationService';

interface StoreSettingsTabProps {
  settings: StoreSettings;
  onRefresh: () => void;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({
  settings,
  onRefresh,
}) => {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [businessHours, setBusinessHours] = useState(settings.business_hours);
  const [taxRate, setTaxRate] = useState(settings.tax_rate * 100);
  const [wifiSsid, setWifiSsid] = useState(settings.wifi_ssid || 'VIBE TASTE 5G');
  const [wifiPassword, setWifiPassword] = useState(settings.wifi_password || '');

  // Legal & Tax Info (NĐ 254/2026 & TT 91/2026)
  const [businessName, setBusinessName] = useState(settings.business_name || 'HỘ KINH DOANH VIBE BISTRO');
  const [taxCode, setTaxCode] = useState(settings.tax_code || '8329102834-001');
  const [ownerName, setOwnerName] = useState(settings.owner_name || 'Nguyễn Văn A');
  const [registrationDate, setRegistrationDate] = useState(settings.registration_date || '2024-03-15');

  // VietQR & Banking
  const [bankId, setBankId] = useState(settings.bank_id || 'MB');
  const [bankAccountNo, setBankAccountNo] = useState(settings.bank_account_no || '0901234567');
  const [bankAccountName, setBankAccountName] = useState(settings.bank_account_name || 'VIBE TASTE RESTAURANT');

  // Production vs Demo Mode Toggle
  const [isDemoMode, setIsDemoMode] = useState<boolean>(settings.is_demo_mode !== false);

  // Voice Alert Toggle (Phase 2.6 & 2.7 VieNeu-TTS)
  const [enableVoiceAlert, setEnableVoiceAlert] = useState<boolean>(settings.enable_voice_alert !== false);
  const [ttsEngine, setTtsEngine] = useState<'vieneu' | 'browser'>(
    settings.tts_engine || voiceNotificationService.getEngine()
  );
  const [vieneuVoice, setVieNeuVoice] = useState<string>(
    settings.vieneu_voice || voiceNotificationService.getVieNeuVoice()
  );
  const [vieneuApiUrl, setVieNeuApiUrl] = useState<string>(
    settings.vieneu_api_url || voiceNotificationService.getVieNeuApiUrl()
  );
  const [testSpeechStatus, setTestSpeechStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ checked: boolean; online: boolean; message: string } | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  // Danger Zone Factory Reset State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    adminService.updateSettings({
      store_name: storeName,
      business_name: businessName,
      tax_code: taxCode,
      owner_name: ownerName,
      registration_date: registrationDate,
      logo_url: logoUrl,
      address,
      phone,
      business_hours: businessHours,
      tax_rate: taxRate / 100,
      wifi_ssid: wifiSsid,
      wifi_password: wifiPassword,
      bank_id: bankId,
      bank_account_no: bankAccountNo,
      bank_account_name: bankAccountName,
      is_demo_mode: isDemoMode,
      enable_voice_alert: enableVoiceAlert,
      tts_engine: ttsEngine,
      vieneu_voice: vieneuVoice,
      vieneu_api_url: vieneuApiUrl,
    });

    voiceNotificationService.setEnabled(enableVoiceAlert);
    voiceNotificationService.setEngine(ttsEngine);
    voiceNotificationService.setVieNeuVoice(vieneuVoice);
    voiceNotificationService.setVieNeuApiUrl(vieneuApiUrl);

    onRefresh();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2500);
  };

  const handleTestVoice = () => {
    voiceNotificationService.setEnabled(true);
    voiceNotificationService.setEngine(ttsEngine);
    voiceNotificationService.setVieNeuVoice(vieneuVoice);
    voiceNotificationService.setVieNeuApiUrl(vieneuApiUrl);
    setTestSpeechStatus('Đang tổng hợp & phát âm thanh VieNeu-TTS...');
    voiceNotificationService.speakText('Khách Tầng 1, Bàn 1 đặt món: Cà phê sữa, số lượng một.');
    setTimeout(() => setTestSpeechStatus(null), 4500);
  };

  const handleCheckConnection = async () => {
    setConnectionStatus({ checked: false, online: false, message: 'Đang kiểm tra kết nối VieNeu-TTS...' });
    const res = await voiceNotificationService.checkVieNeuConnection();
    setConnectionStatus({ checked: true, online: res.online, message: res.message });
  };

  const handleFactoryReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;
    setIsResetting(true);
    try {
      await orderService.factoryResetOrders();
      setIsResetting(false);
      setIsResetModalOpen(false);
      setResetConfirmText('');
      setResetSuccess(true);
      onRefresh();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Settings Form Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        <div className="pb-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              <span>Cấu Hình Thông Tin Nhà Hàng & Bàn Giao</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Thông tin sẽ tự động hiển thị trên Hóa đơn in K80, Mã QR bàn, VietQR và toàn bộ hệ thống
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* Tên Quán */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Tên thương hiệu nhà hàng *:
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Đường dẫn Logo URL:
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          {/* THÔNG TIN PHÁP LÝ & KÊ KHAI THUẾ (NĐ 254/2026/NĐ-CP & TT 91/2026/TT-BTC) */}
          <div className="p-4 bg-purple-50/70 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Thông Tin Pháp Lý & Kê Khai Thuế (NĐ 254/2026 & TT 91/2026)</span>
              </h4>
              <span className="self-start sm:self-auto px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded text-[10px] font-bold">
                Tự động xuất lên tiêu đề Sổ Kế Toán & HĐĐT
              </span>
            </div>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
              Thông tin này sẽ được in trên 5 dòng tiêu đề đầu tiên của Sổ S1, S2, S3, S4, S6, S7 và Bảng kê HĐĐT máy tính tiền theo chuẩn biểu mẫu của Bộ Tài chính.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Tên chính thức HKD/Công ty */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Tên chính thức Hộ kinh doanh / Công ty *:
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value.toUpperCase())}
                    placeholder="VD: HỘ KINH DOANH VIBE BISTRO"
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-purple-200 dark:border-stone-700 rounded-xl font-bold uppercase text-xs"
                  />
                </div>
              </div>

              {/* Mã số thuế */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Mã số thuế (MST) *:
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="VD: 8329102834-001"
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-purple-200 dark:border-stone-700 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Tên chủ hộ KD / Đại diện pháp luật */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Chủ hộ kinh doanh / Đại diện pháp luật *:
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-purple-200 dark:border-stone-700 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              {/* Ngày cấp GPKD */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Ngày cấp giấy phép đăng ký KD:
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-purple-200 dark:border-stone-700 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Địa chỉ & Hotline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Địa chỉ hiển thị trên hóa đơn:
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Hotline chăm sóc khách hàng:
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Giờ mở cửa & VAT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Khung giờ phục vụ:
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Thuế suất GTGT VAT (%):
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="30"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Cấu hình Wifi Khách (In trên Tem QR & Hóa Đơn) */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 space-y-3">
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-amber-500" />
              <span>Thông Tin Wi-Fi Quán (Tự động in trên Tem QR Bàn & Hóa đơn)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Tên mạng Wi-Fi (SSID):
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="VD: VIBE TASTE 5G"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Mật khẩu Wi-Fi:
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="VD: VibeTaste@2026"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Cấu hình VietQR Chuyển Khoản Ngân Hàng */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 space-y-3">
            <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Tài Khoản Nhận Tiền VietQR 24/7 (Tại Quầy Thu Ngân)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Ngân hàng (Mã VietQR):
                </label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                >
                  <option value="MB">MBBank (Quân Đội)</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="TCB">Techcombank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="VPB">VPBank</option>
                  <option value="TPB">TPBank</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Số tài khoản nhận:
                </label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Tên chủ tài khoản:
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold uppercase"
                />
              </div>
            </div>
          </div>

          {/* CẤU HÌNH LOA THÔNG BÁO GIỌNG NÓI & VIENEU-TTS AI ENGINE (PHASE 2.6 & 2.7) */}
          <div className="p-5 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                      <span>Loa Thông Báo Giọng Nói Tự Động (Bếp/Bar & Phục Vụ)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        VieNeu-TTS AI Ready
                      </span>
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Tự động phát chuông và đọc to tên món, số bàn bằng giọng đọc tiếng Việt tự nhiên khi có đơn hàng mới hoặc khi món ăn làm xong.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !enableVoiceAlert;
                  setEnableVoiceAlert(next);
                  voiceNotificationService.setEnabled(next);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
                  enableVoiceAlert
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-stone-800 text-stone-200 border border-stone-700'
                }`}
              >
                {enableVoiceAlert ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-stone-400" />}
                <span>{enableVoiceAlert ? 'Đang Bật Loa' : 'Đã Tắt Loa'}</span>
              </button>
            </div>

            {enableVoiceAlert && (
              <div className="pt-3 border-t border-stone-200 dark:border-stone-700/80 space-y-4 animate-fade-in">
                {/* 1. Chọn Engine Giọng Nói */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTtsEngine('vieneu')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      ttsEngine === 'vieneu'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 ${ttsEngine === 'vieneu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                        <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">VieNeu-TTS AI (Khuyên dùng)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-white">48 kHz</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Giọng AI nhân bản siêu tự nhiên, dõng dạc, chuẩn phát thanh viên tiếng Việt 3 miền. Tự động dự phòng trình duyệt khi offline.
                    </p>
                  </div>

                  <div
                    onClick={() => setTtsEngine('browser')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      ttsEngine === 'browser'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Radio className={`w-4 h-4 ${ttsEngine === 'browser' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                        <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">Trình Duyệt (Web Speech API)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">Offline</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Dùng bộ đọc gốc của điện thoại/máy tính (Google, Apple, Microsoft). Không cần cài thêm server.
                    </p>
                  </div>
                </div>

                {/* 2. Cấu hình chi tiết VieNeu-TTS (Khi chọn VieNeu) */}
                {ttsEngine === 'vieneu' && (
                  <div className="p-3.5 bg-stone-100/70 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                          <Mic className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chọn Giọng Đọc VieNeu-TTS:</span>
                        </label>
                        <select
                          value={vieneuVoice}
                          onChange={(e) => setVieNeuVoice(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs text-stone-900 dark:text-white"
                        >
                          {VIENEU_PRESET_VOICES.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.gender.toUpperCase()} - Miền {v.region})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1">
                          {VIENEU_PRESET_VOICES.find((v) => v.id === vieneuVoice)?.description || ''}
                        </p>
                      </div>

                      <div>
                        <label className="font-bold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          <span>VieNeu-TTS Server Endpoint:</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={vieneuApiUrl}
                            onChange={(e) => setVieNeuApiUrl(e.target.value)}
                            placeholder="http://127.0.0.1:8000/v1"
                            className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono text-xs font-bold text-stone-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleCheckConnection}
                            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 transition-colors whitespace-nowrap"
                          >
                            Kiểm Tra
                          </button>
                        </div>
                        {connectionStatus && (
                          <p className={`text-[10px] font-bold mt-1 ${connectionStatus.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {connectionStatus.online ? '🟢 ' : '🟡 '}
                            {connectionStatus.message}
                          </p>
                        )}
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                          💡 <strong>Chế độ kép:</strong> Chạy file <code className="text-amber-600 dark:text-amber-400 font-bold">start_vieneu.bat</code> trên máy thu ngân để phát siêu tốc (115ms). Khi mở trên Vercel hoặc điện thoại, hệ thống tự động chuyển tiếp qua VieNeu-TTS Cloud AI (Hugging Face) không cần cấu hình.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Nút Nghe Thử Âm Thanh Mẫu */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <span>Mẫu câu thử nghiệm:</span>
                    <span className="italic text-stone-700 dark:text-stone-300">
                      "Khách Tầng 1, Bàn 1 đặt món: Cà phê sữa, số lượng một."
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Nghe Thử Giọng</span>
                  </button>
                </div>
                {testSpeechStatus && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse text-right">
                    {testSpeechStatus}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CHẾ ĐỘ PRODUCTION / DEMO TOGGLE */}
          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200">
                  Chế Độ Vận Hành: {isDemoMode ? 'Demo / Đào Tạo Nhân Viên' : 'Production Chính Thức'}
                </h4>
              </div>
              <p className="text-[11px] text-purple-800 dark:text-purple-300">
                {isDemoMode
                  ? '🟢 Đang bật: Hiển thị Đăng nhập 1-chạm & Nút Giả lập E2E để làm quen hệ thống.'
                  : '🔒 Chế độ Production: Đã ẩn danh sách Đăng nhập 1-chạm và nút Giả lập E2E để bảo mật tuyệt đối cho cửa hàng.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
                isDemoMode
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-stone-800 text-stone-200 border border-stone-700'
              }`}
            >
              {isDemoMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-stone-400" />}
              <span>{isDemoMode ? 'Đang Bật Demo' : 'Tắt (Production)'}</span>
            </button>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div>
              {isSuccess && (
                <span className="text-emerald-500 font-bold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã lưu cấu hình cửa hàng lên Cloud thành công!
                </span>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </form>
      </div>

      {/* VÙNG NGUY HIỂM - DANGER ZONE (FACTORY RESET TEST ORDERS) */}
      <div className="bg-white dark:bg-stone-900 border-2 border-rose-300 dark:border-rose-900/60 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-black text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Vùng Nguy Hiểm: Khởi Tạo Lại Dữ Liệu Giao Dịch (Factory Reset Orders)</span>
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Xóa toàn bộ lịch sử hóa đơn, doanh thu test, ca làm việc và giải phóng toàn bộ bàn về trống trước ngày khai trương chính thức.
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ Giữ nguyên 100%: Thực đơn món ăn, Danh mục, Nguyên vật liệu, Bảng định mức BOM, Sơ đồ bàn & Tài khoản nhân viên.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xóa Đơn Hàng & Reset Test</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã xóa toàn bộ đơn hàng test và đưa tất cả bàn về trống thành công!</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Factory Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 border-2 border-rose-500 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Xác Nhận Khởi Tạo Lại Dữ Liệu Giao Dịch</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
              <p className="font-bold">⚠️ CẢNH BÁO KHÔNG THỂ HOÀN TÁC:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Xóa sạch toàn bộ đơn hàng và hóa đơn trên máy & Supabase Cloud.</li>
                <li>Xóa lịch sử ca làm việc và đưa tổng doanh thu về 0đ.</li>
                <li>Chuyển trạng thái tất cả các bàn ăn về "Trống (Available)".</li>
              </ul>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 block">
                Để xác nhận, vui lòng gõ chữ <span className="font-mono text-rose-600 font-black">RESET</span> vào ô bên dưới:
              </label>
              <input
                type="text"
                placeholder="Gõ RESET..."
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono font-black text-center text-sm text-stone-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs hover:bg-stone-200"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || isResetting}
                onClick={handleFactoryReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                {isResetting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
