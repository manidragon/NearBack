// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Config\Api.ts
import axios from 'axios';

export const API_URL = "http://localhost:8080";
export const DEPLOYED_URL = "https://near-look-app.com"
// change api

export const api = axios.create({
  baseURL: API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});