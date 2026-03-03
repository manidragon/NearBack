// D:\Mani\Code with Zosh\Backup\source code\frontend\src\util\uploadToCloudnary.ts
export const uploadToCloudinary = async (pics:any) => {

    const cloud_name="dt6nu9oqs"
    const upload_preset="nearlook"
    const url = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
    
    if (pics) {
      
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", upload_preset);
      data.append("cloud_name", cloud_name);
  
      const res = await 
      fetch(url, {
        method: "post",
        body: data,
      })
        
        const fileData=await res.json();
        console.log("imageurl : ", fileData.url);
        return fileData.url
  
    } else {
      console.log("error");
    }
  };