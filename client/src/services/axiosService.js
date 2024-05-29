import api from "./api";


export const getMethod = async (url) => {
    const { data } = await api.get(url);
    return data;
}

export const postMethod = async ({ url, body, config = {} }) => {

    const { data } = await api.post(url, body, config);

    return data;
}


export const putMethod = async ({ url, body, config = {} }) => {

    const { data } = await api.put(url, body, config);

    return data;
}

export const deleteMethod = async ({ url, config = {} }) => {

    const { data } = await api.delete(url, config);

    return data;
}

export const axiosMethods = async ({ url, method, body, config }) => {
    const { data } = await api({
        method,
        url,
        ...body && { data: body },
        ...config && { config },

    })

    return data;
}