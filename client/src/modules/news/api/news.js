import { axiosPrivate } from "@/config/axios"

export function GetNewsApi (body) {
    return axiosPrivate.get('/news/', body)
}