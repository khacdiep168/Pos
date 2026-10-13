// Thermal Printer Service for ESC/POS, Web Bluetooth, Web Serial and Network LAN Printing

export interface PrinterConnection {
  type: 'browser' | 'bluetooth' | 'serial' | 'network';
  name: string;
  connected: boolean;
}

class ThermalPrinterManager {
  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private currentConnection: PrinterConnection = {
    type: 'browser',
    name: 'Mặc định (Trình duyệt)',
    connected: true,
  };

  /**
   * Check if Web Bluetooth is supported by current browser (Chrome, Edge, Opera)
   */
  public isBluetoothSupported(): boolean {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Check if Web Serial (USB) is supported
   */
  public isSerialSupported(): boolean {
    return typeof window !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Connect to an ESC/POS Bluetooth Thermal Printer (Xprinter, Zywell, HPRT, etc.)
   */
  public async connectBluetooth(): Promise<PrinterConnection> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Trình duyệt không hỗ trợ Web Bluetooth API. Vui lòng dùng Chrome hoặc Edge trên Android/PC.');
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.bluetoothCharacteristic = char;
            break;
          }
        }
        if (this.bluetoothCharacteristic) break;
      }

      this.bluetoothDevice = device;
      this.currentConnection = {
        type: 'bluetooth',
        name: device.name || 'Máy in Bluetooth POS',
        connected: true,
      };

      return this.currentConnection;
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      throw new Error(err.message || 'Không thể kết nối máy in Bluetooth');
    }
  }

  /**
   * Print raw ESC/POS commands to connected hardware printer or fallback to window.print()
   */
  public async print(data?: Uint8Array): Promise<boolean> {
    // If connected via Web Bluetooth, stream ESC/POS commands
    if (this.bluetoothCharacteristic && data) {
      try {
        const CHUNK_SIZE = 512;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          await this.bluetoothCharacteristic.writeValue(chunk);
        }
        return true;
      } catch (err) {
        console.warn('Bluetooth print failed, falling back to window.print():', err);
      }
    }

    // Default universal browser printing
    if (typeof window !== 'undefined') {
      window.print();
      return true;
    }

    return false;
  }

  /**
   * Helper: Build standard ESC/POS bytes for thermal receipt printing
   */
  public buildEscPosReceipt(ticket: {
    title: string;
    subTitle: string;
    items: Array<{ name: string; qty: number; note?: string }>;
    footerNote: string;
  }): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: number[] = [];

    // ESC @: Initialize printer
    chunks.push(0x1b, 0x40);

    // ESC a 1: Center align
    chunks.push(0x1b, 0x61, 0x01);

    // Double height & double width for title
    chunks.push(0x1d, 0x21, 0x11);
    chunks.push(...Array.from(encoder.encode(ticket.title + '\n')));

    // Normal text
    chunks.push(0x1d, 0x21, 0x00);
    chunks.push(...Array.from(encoder.encode(ticket.subTitle + '\n')));
    chunks.push(...Array.from(encoder.encode('--------------------------------\n')));

    // ESC a 0: Left align
    chunks.push(0x1b, 0x61, 0x00);

    ticket.items.forEach((item) => {
      // Bold item name + qty
      chunks.push(0x1b, 0x45, 0x01);
      chunks.push(...Array.from(encoder.encode(`${item.name} x${item.qty}\n`)));
      chunks.push(0x1b, 0x45, 0x00);
      if (item.note) {
        chunks.push(...Array.from(encoder.encode(`  * Ghi chú: ${item.note}\n`)));
      }
    });

    chunks.push(...Array.from(encoder.encode('--------------------------------\n')));
    // ESC a 1: Center align footer
    chunks.push(0x1b, 0x61, 0x01);
    chunks.push(...Array.from(encoder.encode(ticket.footerNote + '\n\n\n')));

    // GS V 66 0: Cut paper
    chunks.push(0x1d, 0x56, 0x42, 0x00);

    return new Uint8Array(chunks);
  }

  public getConnection(): PrinterConnection {
    return this.currentConnection;
  }
}

export const thermalPrinter = new ThermalPrinterManager();
