import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: 'dc4kwuipu',
  api_key: '151292133684892',
  api_secret: 'NI2trZ7qxEnGIht_VihE0pz_mrU'
})

export const handleUpload = async (image) => {
  const { secure_url, public_id } = await cloudinary.uploader.upload(image,
    {
      overwrite: true
    }
  )

  return { secure_url, public_id }
}

export const handleUploadUpdate = async (image, publicId) => {
  const { secure_url } = await cloudinary.uploader.upload(image,
    {
      public_id: publicId,
      invalidate: true

    })

  return { secure_url }
}

export const handleDeleteFile = async (image) => cloudinary.uploader.destroy(image)
