import { axiosPrivate } from '@/config/axios'

export function GetSettingsByUserIdFetch(id) {
  return axiosPrivate.get(`/settings/${id}`)
}

export function SaveLanguage(body) {
  return axiosPrivate.post('/settings/language', body)
}

export function SaveDisplaySettings(body) {
  return axiosPrivate.post('/settings/display', body)
}
