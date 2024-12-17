import { axiosPrivate } from "@/config/axios"
import { AxiosResponse } from "axios"

export function GetNewsApi (body:any) :Promise<AxiosResponse<any, any>>{
    return axiosPrivate.get('/news/', body)
}