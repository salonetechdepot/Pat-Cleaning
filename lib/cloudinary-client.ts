// pp\lib\cloudinary-client.ts
export async function uploadToCloudinary(file: File): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

    console.log("uploading to", url) // add this line
  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", "patpro_unsigned") // the preset you just created

  const res = await fetch(url, { method: "POST", body: fd })
  const data = await res.json()
    console.log("cloudinary resp", data) // and this
  return data.secure_url as string
}