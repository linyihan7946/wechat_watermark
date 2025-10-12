// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

interface GeneralCallbackResult {
  errMsg: string;
}

Component({
  data: {
  },
  methods: {
    // 选择图片
    chooseImage(): void {
      wx.chooseImage({
        count: 9, // 最多可选择的图片数量，默认9
        sizeType: ['original', 'compressed'], // 图片类型，可选择原图或压缩图
        sourceType: ['album', 'camera'], // 选择来源，相册和相机
        success: (res: WechatMiniprogram.ChooseImageSuccessCallbackResult) => {
          const tempFilePaths: string[] = res.tempFilePaths;
          console.log('选择的图片临时路径:', tempFilePaths);
          // 这里可以将路径保存到data中或直接处理上传
          if (tempFilePaths.length > 0) {
            this.showImage(tempFilePaths[0]);
          }
        },
        fail: (err: GeneralCallbackResult) => {
          console.error('选择图片失败:', err.errMsg);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        },
        complete: () => {
          console.log('选择图片操作完成');
        }
      });
    },

    // 选择视频
    chooseVedio(): void {
      wx.chooseImage({
        count: 9, // 最多可选择的图片数量，默认9
        sizeType: ['original', 'compressed'], // 图片类型，可选择原图或压缩图
        sourceType: ['album', 'camera'], // 选择来源，相册和相机
        success: (res: WechatMiniprogram.ChooseImageSuccessCallbackResult) => {
          const tempFilePaths: string[] = res.tempFilePaths;
          console.log('选择的图片临时路径:', tempFilePaths);
          // 这里可以将路径保存到data中或直接处理上传
          if (tempFilePaths.length > 0) {
            this.showImage(tempFilePaths[0]);
          }
        },
        fail: (err: GeneralCallbackResult) => {
          console.error('选择图片失败:', err.errMsg);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        },
        complete: () => {
          console.log('选择图片操作完成');
        }
      });
    },

    // 跳转到显示图片页面
    showImage(image_url: string): void {
      const url: string = "/pages/showimage/showimage" + "?image_url=" + image_url; 
      wx.navigateTo({url});
      console.log(url);
    }
  }
})
