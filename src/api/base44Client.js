import axios from 'axios';

const apiHost = import.meta.env.DEV ? window.location.hostname : 'localhost';

export const base44 = axios.create({
  baseURL: `http://${apiHost}:5000/api`,
  withCredentials: true,
});

export const getLocalFileUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `http://${apiHost}:5000/${String(filePath).replace(/^\/+/, '')}`;
};
