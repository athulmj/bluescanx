// src/app/components/device-info/device-info.component.ts
import { Component } from '@angular/core';
import { BluetoothService } from '../../services/bluetooth.service';

@Component({
  selector: 'app-device-info',
  templateUrl: './device-info.component.html',
  styleUrls: ['./device-info.component.scss']
})
export class DeviceInfoComponent {
  deviceDetails: any = null;
  loading = false;
  error: string | null = null;
  id: string = '00001800-0000-1000-8000-00805f9b34fb';

  constructor(private btService: BluetoothService) { }

  async connect(id:any) {
    this.loading = true;
    this.error = null;
    try {
      this.deviceDetails = await this.btService.connectToDevice(id);
    } catch (err: any) {
      this.error = err.message || 'Failed to connect.';
    }
    this.loading = false;
  }

  disconnect() {
    this.btService.disconnect();
    this.deviceDetails = null;
  }

  foundDevices: any[] = [];


  async scanDevice() {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });
  
      // Add only if new
      if (!this.foundDevices.some(d => d.id === device.id)) {
        this.foundDevices.push({
          name: device.name || 'Unknown Device',
          id: device.id,
          device
        });
      }
    } catch (err) {
      console.warn('Scan cancelled or failed:', err);
    }
  }

}
