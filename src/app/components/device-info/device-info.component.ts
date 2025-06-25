// src/app/components/device-info/device-info.component.ts
import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../../services/bluetooth.service';

@Component({
  selector: 'app-device-info',
  templateUrl: './device-info.component.html',
  styleUrls: ['./device-info.component.scss']
})
export class DeviceInfoComponent implements OnInit {
  deviceDetails: any = null;
  loading = false;
  error: string | null = null;
  empty: string | null = null;
  id: string = '00001800-0000-1000-8000-00805f9b34fb';
  devices: any[] = [];

  constructor(private btService: BluetoothService) { }

  ngOnInit(): void {
    this.btService.foundDevices$.subscribe(devices => {
      this.devices = devices.map(device => {
        if (device.name === 'Unknown Device' && device.details?.services) {
          for (const service of device.details.services) {
            for (const characteristic of service.characteristics) {
              const value = characteristic.value?.trim();
              if (
                characteristic.properties.read &&
                value &&
                /[a-zA-Z0-9]/.test(value)
              ) {
                return {
                  ...device,
                  name: value,
                  details: {
                    ...device.details,
                    name: value
                  }
                };
              }
            }
          }
        }
        return device;
      });
    });
  }


  async connect() {
    this.loading = true;
    this.error = null;
    this.deviceDetails = null;
    this.empty = null;
    try {
      this.deviceDetails = await this.btService.connectToDevice(this.id);
    } catch (err: any) {
      this.error = err.message || 'Failed to connect.';
    }
    this.loading = false;
  }

  selectDeviceDetails(device: any) {
    this.error = null;
    this.deviceDetails = device.details || null;
    this.empty = 'Connection Failure, No data Found';
  }

  disconnect() {
    this.btService.disconnect();
    this.deviceDetails = null;
  }

}
