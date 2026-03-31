// Preload can expose secure APIs to renderer via contextBridge
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronApi', {
  platform: process.platform,
});
