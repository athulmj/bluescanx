// bluetooth.service.ts
/// <reference types="web-bluetooth" />

// src/app/services/bluetooth.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  constructor() { }

  async connectToDevice(id:any): Promise<any> {
    try {
      const nav: Navigator = navigator; // not needed after type package
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [id]
      });

      this.server = await this.device.gatt?.connect() || null;

      const services = await this.server?.getPrimaryServices() || [];

      const deviceDetails: any = {
        name: this.device.name,
        id: this.device.id,
        services: []
      };

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        const charDetails = await Promise.all(characteristics.map(async char => {
          let value = null;
          try {
            const val = await char.readValue();
            const decoder = new TextDecoder('utf-8');
            value = decoder.decode(val.buffer);
          } catch (e) {
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

      return deviceDetails;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }
}
