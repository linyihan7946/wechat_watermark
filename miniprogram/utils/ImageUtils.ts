export class ImageUtils {

    static Instance = new ImageUtils();
    
    // 获取图片信息
    async getImageInfo(imagePath: string): Promise<{ width: number, height: number }> {
        return new Promise((resolve, reject) => {
            wx.getImageInfo({
                src: imagePath,
                success: (res) => {
                    resolve({ width: res.width, height: res.height });
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    }
}