// bluetooth.service.ts
/// <reference types="web-bluetooth" />

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  private foundDevicesSubject = new BehaviorSubject<any[]>([]);
  public foundDevices$ = this.foundDevicesSubject.asObservable(); // exposed observable
  foundDevices: any[] = [];

  constructor() { }

  async connectToDevice(id: any): Promise<any> {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [id]
      });

      let currentDevices = this.foundDevicesSubject.value;

      const deviceIndex = currentDevices.findIndex(d => d.id === this.device?.id);

      if (deviceIndex === -1) {
        currentDevices = [
          ...currentDevices,
          {
            name: this.device.name || 'Unknown Device',
            id: this.device.id,
            status: 'connecting'
          }
        ];
      } else {
        currentDevices[deviceIndex].status = 'connecting';
      }

      this.foundDevicesSubject.next([...currentDevices]);

      this.server = await this.device.gatt?.connect() || null;
      const services = await this.server?.getPrimaryServices() || [];

      const deviceDetails: any = {
        name: this.device.name,
        id: this.device.id,
        services: []
      };

      let resolvedName: string | null = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        const charDetails = await Promise.all(characteristics.map(async char => {
          let value = null;
          try {
            const val = await char.readValue();
            const decoder = new TextDecoder('utf-8');
            value = decoder.decode(val.buffer);

            // ✅ Check for a valid name-like value
            if (
              resolvedName === null &&
              char.properties.read &&
              value &&
              /[a-zA-Z0-9]/.test(value.trim())
            ) {
              resolvedName = value.trim();
            }
          } catch {
            value = 'Not Readable';
          }

          return {
            uuid: char.uuid,
            properties: {
              read: char.properties.read,
              write: char.properties.write,
              notify: char.properties.notify,
              indicate: char.properties.indicate
            },
            value
          };
        }));

        deviceDetails.services.push({
          uuid: service.uuid,
          characteristics: charDetails
        });
      }

      // ✅ Override deviceDetails.name if a better one was found
      if (resolvedName) {
        deviceDetails.name = resolvedName;
      }

      // ✅ Set status = 'success' and update device name in foundDevices
      const updated = this.foundDevicesSubject.value.map(dev =>
        dev.id === this.device?.id
          ? {
            ...dev,
            status: 'success',
            name: resolvedName || dev.name,
            details: {
              ...deviceDetails,
              name: resolvedName || deviceDetails.name
            }
          }
          : dev
      );

      this.foundDevicesSubject.next(updated);

      return deviceDetails;

    } catch (error) {
      console.error('Bluetooth connection error:', error);

      // ❌ Set status = 'failure'
      const updated = this.foundDevicesSubject.value.map(dev =>
        dev.id === this.device?.id
          ? { ...dev, status: 'failure' }
          : dev
      );
      this.foundDevicesSubject.next(updated);

      throw error;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }
}
