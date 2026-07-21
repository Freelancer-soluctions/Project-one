import { axiosPrivate } from '@/config/axios';

export const GetSettingsByUserIdFetch = async (userId) => {
  const response = await axiosPrivate.get(`/settings/${userId}`);
  return response;
};

export const SaveLanguage = async (data) => {
  const response = await axiosPrivate.post('/settings/language/', data);
  return response;
};

export const SaveDisplaySettings = async (data) => {
  const response = await axiosPrivate.post('/settings/display/', data);
  return response;
};

export const PatchSettingsById = async ({ id, data }) => {
  const response = await axiosPrivate.patch(`/settings/${id}`, data);
  return response;
};