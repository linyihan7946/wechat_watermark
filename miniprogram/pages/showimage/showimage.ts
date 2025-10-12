// pages/showimage/showimage.ts
import "../../utils/CanvasOperate";
import { CanvasOperate } from "../../utils/CanvasOperate";
import { GeometryUtils, Point, Rectangle } from "../../utils/geometry";
import { WatermarkRegion, MiniProgramWatermarkRemoverSimple } from "../../utils/MiniProgramWatermarkRemoverSimple";

interface CanvasInfoType {
  lastEvtPos: { x: number, y: number };
  dragTarget: { x: number, y: number };
}

// 开始拖拽时矩形的信息
interface StartDragRectInfo {
  x: number,
  y: number,
  width: number,
  height: number,
  selectType: "None" | "Center" | "LeftTop" | "LeftBottom" | "RightTop" | "RightBottom",
  rectIndex: number,// 正在拖动的矩形的索引
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 图片链接
    image_url: "",

    // 画布拖拽信息
    canvasInfo: {
      lastEvtPos: { x: 0, y: 0 }, // 最后事件位置
      dragTarget: { x: 0, y: 0 } // 拖拽目标位置
    } as CanvasInfoType,

    // 画布操作的类
    ctx: new CanvasOperate(),

    // 是否获取到画布或图片尺寸
    isGetSize: false,
    canvasSize: { width: 0, height: 0 },
    isGetImageSize: false,
    imageSize: { width: 0, height: 0 },
    scale: 1.0,// 图片缩放
    pointLT: {x: 0, y: 0} as Point,// 左上角
    
    // 开始拖拽时矩形位置
    startDragRectInfo: {
      x: 100,
      y: 100,
      width: 100,
      height: 30,
      selectType: "None",
      rectIndex: -1,
    } as StartDragRectInfo,

    // 矩形信息列表
    rectInfoList: [] as Rectangle[],

    isRemoveWatermark: false,// 是否移除水印
  },

  getComponentSize(id: string): Promise<{ width: number, height: number }> {
    const promise: Promise<{ width: number, height: number }> = new Promise((resolve) => {
      let width = 300;
      let height = 300;
      const query = wx.createSelectorQuery()
      query.select(id).boundingClientRect((rect) => {
        if (rect) {
          width = rect.width;
          height = rect.height;
        }
        resolve({ width, height })
      }).exec();
    });
    return promise;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    // 获取从首页传递过来的图片路径参数
    if (!options || !options.image_url) {
      return;
    }
    const image_url = decodeURIComponent(options.image_url);
    this.setData({
      image_url
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    const image_url = this.data.image_url;
    const ctx = new CanvasOperate();
    this.setData({ ctx });
    ctx.createCanvasContext('myCanvas');
    this.getComponentSize(".view1").then(size => {
      this.setData({ isGetSize: true, canvasSize: size })

      // 2. 获取图片信息
      wx.getImageInfo({
        src: image_url,
        success: (res) => {
          this.setData({ imageSize: res });
          this.updateCanvas();
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err)
        }
      })
    });
  },

  // 刷新canvas
  updateCanvas(): void {
    if (!this.data.isGetSize) {
      return;
    }
    const ctx = this.data.ctx;
    const imgWidth = this.data.imageSize.width
    const imgHeight = this.data.imageSize.height
    const canvasWidth = this.data.canvasSize.width;
    const canvasHeight = this.data.canvasSize.height;
    const image_url = this.data.image_url;

    // 3. 计算缩放比例，使图片适应Canvas大小，这里使用mode: 'aspectFit'的逻辑
    let scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    let drawWidth = imgWidth * scale
    let drawHeight = imgHeight * scale
    let x = (canvasWidth - drawWidth) / 2
    let y = (canvasHeight - drawHeight) / 2
    this.setData({scale, pointLT: {x, y}});
    // 清空画布
    ctx.clearRect(0, 0, this.data.canvasSize.width, this.data.canvasSize.height);
    // if (this.data.isRemoveWatermark) 
    // {
      ctx.removeWatermarks(x, y, drawWidth, drawHeight, image_url, this.data.rectInfoList);
    // } else {
    //   // 绘制图片
    //   ctx.drawImage(image_url, x, y, drawWidth, drawHeight)

    //   // 绘制矩形
    //   for (let i = 0; i < this.data.rectInfoList.length; i++) {
    //     const r = this.data.rectInfoList[i];
    //     ctx.drawRect({
    //       x: r.x,
    //       y: r.y,
    //       width: r.width,
    //       height: r.height,
    //       lineWidth: 4,
    //       strokeStyle: "#00ff00",
    //       lineCap: "round",
    //       lineJoin: "round"
    //     });
    //   }

    //   // 7. 执行绘制
    //   ctx.draw()
    // }
  },

  // 处理 Canvas 触摸开始事件
  handleCanvasStart(e: WechatMiniprogram.TouchEvent): void {
    const canvasPosition = this.getCanvasPosition(e);
    const { canvasInfo, startDragRectInfo } = this.data;

    // 更新状态和最后事件位置
    canvasInfo.lastEvtPos = { x: canvasPosition.x, y: canvasPosition.y };

    // 计算有没有选中矩形，选中矩形的哪个位置
    const ptMouse: Point = canvasPosition;
    const tol = 10;
    const offsetX = 10;
    const offsetY = 10;
    startDragRectInfo.rectIndex = -1;
    for (let i = 0; i < this.data.rectInfoList.length; i++) {
      const r = this.data.rectInfoList[i];
      const ptLT: Point = {x: r.x, y: r.y};
      const ptLB: Point = {x: r.x, y: r.y + r.height};
      const ptRT: Point = {x: r.x + r.width, y: r.y};
      const ptRB: Point = {x: r.x + r.width, y: r.y + r.height};
      const rect: Rectangle = {
        x: r.x, 
        y: r.y,
        width: r.width,
        height: r.height
      };
      rect.x -= offsetX; rect.y -= offsetY; rect.width += offsetX * 2; rect.height += offsetY * 2;
      const disLT = GeometryUtils.distance(ptMouse, ptLT);
      const disLB = GeometryUtils.distance(ptMouse, ptLB);
      const disRT = GeometryUtils.distance(ptMouse, ptRT);
      const disRB = GeometryUtils.distance(ptMouse, ptRB);
      const disMin = Math.min(Math.min(disLT, disLB), Math.min(disRT, disRB));
      if (disMin <= tol) {// 选中四边
        if (disMin === disLT) {// 左上
          startDragRectInfo.selectType = "LeftTop";
        } else if (disMin === disLB) {// 左下
          startDragRectInfo.selectType = "LeftBottom";
        } else if (disMin === disRT) {// 右上
          startDragRectInfo.selectType = "RightTop";
        } else {// 右下
          startDragRectInfo.selectType = "RightBottom";
        }
      } else if (GeometryUtils.isPointInRectangle(ptMouse, rect)) {// 选中中间
        startDragRectInfo.selectType = "Center";
      } else {// 没有选中
        startDragRectInfo.selectType = "None";
      }
      if (startDragRectInfo.selectType !== "None") {
        startDragRectInfo.x = r.x;
        startDragRectInfo.y = r.y;
        startDragRectInfo.width = r.width;
        startDragRectInfo.height = r.height;
        startDragRectInfo.rectIndex = i;
        break;
      }
    }

    this.setData({ canvasInfo, startDragRectInfo });
  },

  // 处理 Canvas 触摸移动事件
  handleCanvasMove(e: WechatMiniprogram.TouchEvent): void {
    if (!this.data.isGetSize) {
      return;
    }
    const canvasPosition = this.getCanvasPosition(e);
    const { canvasInfo, startDragRectInfo, rectInfoList } = this.data;
    // 更新拖拽目标位置
    canvasInfo.dragTarget.x = canvasPosition.x;
    canvasInfo.dragTarget.y = canvasPosition.y;
    const minWidth = 50;
    const minHeight = 20;

    const selectType = startDragRectInfo.selectType;
    const move: Point = {
      x: canvasInfo.dragTarget.x - canvasInfo.lastEvtPos.x, 
      y: canvasInfo.dragTarget.y - canvasInfo.lastEvtPos.y
    };
    this.setData({ canvasInfo });
    const currentRectInfo: Rectangle | undefined = (rectInfoList.length > startDragRectInfo.rectIndex) ? rectInfoList[startDragRectInfo.rectIndex] : undefined;
    if (!currentRectInfo) {
      return;
    }
    if (selectType === "Center") {// 中间，已实现
      const x = startDragRectInfo.x + move.x;
      const y = startDragRectInfo.y + move.y;
      currentRectInfo.x = x;
      currentRectInfo.y = y;
      this.setData({rectInfoList});
      this.updateCanvas();
    } else if (selectType === "LeftTop") {// 左上角
      let x = canvasPosition.x;
      let y = canvasPosition.y;
      let width = (currentRectInfo.x + currentRectInfo.width) - x;
      let height = (currentRectInfo.y + currentRectInfo.height) - y;
      if (width < minWidth && height < minHeight) {
        return;
      }
      if (width < minWidth) {
        width = minWidth;
        x = (currentRectInfo.x + currentRectInfo.width) - width;
      }
      if (height < minHeight) {
        height = minHeight;
        y = (currentRectInfo.y + currentRectInfo.height) - height;
      }
      currentRectInfo.x = x;
      currentRectInfo.y = y;
      currentRectInfo.width = width;
      currentRectInfo.height = height;
      this.setData({currentRectInfo});
      this.updateCanvas();
    } else if (selectType === "LeftBottom") {// 左下角
      const right = startDragRectInfo.x + startDragRectInfo.width;
      const top = startDragRectInfo.y;
      let width = right - canvasPosition.x;
      let height = canvasPosition.y - top;
      let x = canvasPosition.x;
      let y = canvasPosition.y - height;
      if (width < minWidth && height < minHeight) {
        return;
      }
      if (width < minWidth) {
        width = minWidth;
        x = right - width;
      }
      if (height < minHeight) {
        height = minHeight;
        y = top;
      }
      currentRectInfo.x = x;
      currentRectInfo.y = y;
      currentRectInfo.width = width;
      currentRectInfo.height = height;
      this.setData({currentRectInfo});
      this.updateCanvas();
    } else if (selectType === "RightTop") {// 右上角
      const left = startDragRectInfo.x;
      const bottom = startDragRectInfo.y + startDragRectInfo.height;
      let x = left;
      let y = canvasPosition.y;
      let width = canvasPosition.x - left;
      let height = bottom - y;
      if (width < minWidth && height < minHeight) {
        return;
      }
      if (width < minWidth) {
        width = minWidth;
        x = left;
      }
      if (height < minHeight) {
        height = minHeight;
        y = bottom - height;
      }
      currentRectInfo.x = x;
      currentRectInfo.y = y;
      currentRectInfo.width = width;
      currentRectInfo.height = height;
      this.setData({currentRectInfo});
      this.updateCanvas();
    } else if (selectType === "RightBottom") {// 右下角
      const left = startDragRectInfo.x;
      const top = startDragRectInfo.y;
      let x = left;
      let y = top;
      let width = canvasPosition.x - x;
      let height = canvasPosition.y - y;
      if (width < minWidth && height < minHeight) {
        return;
      }
      if (width < minWidth) {
        width = minWidth;
        x = left;
      }
      if (height < minHeight) {
        height = minHeight;
        y = top;
      }
      currentRectInfo.x = x;
      currentRectInfo.y = y;
      currentRectInfo.width = width;
      currentRectInfo.height = height;
      this.setData({currentRectInfo});
      this.updateCanvas();
    } else {// 没有选中
      console.log("没有选中")
    }
  },

  // 处理 Canvas 触摸结束事件
  handleCanvasEnd(_e: WechatMiniprogram.TouchEvent): void {
  },

  // 获取 Canvas 位置信息
  getCanvasPosition(e: WechatMiniprogram.TouchEvent): { x: number, y: number } {
    const touch = e.touches[0];
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  },

  // 添加矩形区域
  addRect(): void {
    this.data.rectInfoList.push({
      x: 100,
      y: 100,
      width: 100,
      height: 30
    });
    this.updateCanvas();
  },

  // 保存
  async save(): Promise<void> {
    try {
      // 检查是否有选择的水印区域
      if (this.data.rectInfoList.length === 0) {
        wx.showToast({
          title: '请先框选水印区域',
          icon: 'none'
        });
        return;
      }

      // 显示加载提示
      wx.showLoading({
        title: '正在处理图片...'
      });

      // 去水印并获取处理后的图片路径
      const processedImagePath = await this.removeWatermark();
      
      if (!processedImagePath) {
        wx.hideLoading();
        wx.showToast({
          title: '图片处理失败',
          icon: 'error'
        });
        return;
      }

      // 保存图片到相册
      await this.saveImageToAlbum(processedImagePath);
      
    } catch (error) {
      console.error('保存图片失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 保存图片到相册
  async saveImageToAlbum(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: imagePath,
        success: () => {
          wx.hideLoading();
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          resolve();
        },
        fail: (error: any) => {
          wx.hideLoading();
          console.error('保存到相册失败:', error);
          
          // 处理权限被拒绝的情况
          if (error.errMsg && error.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要授权保存图片到相册，请在设置中开启权限',
              confirmText: '去设置',
              cancelText: '取消',
              success: (res: any) => {
                if (res.confirm) {
                  wx.openSetting({
                    success: (settingRes: any) => {
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        // 用户授权后重新尝试保存
                        this.saveImageToAlbum(imagePath);
                      }
                    }
                  });
                }
              }
            });
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'error'
            });
          }
          reject(error);
        }
      });
    });
  },

  // 去水印
  async removeWatermark(): Promise<string> {
    let result = "";
    const imageUrl = this.data.image_url;
    const remover = new MiniProgramWatermarkRemoverSimple("myCanvas");
    const regions: WatermarkRegion[] = [];
    // const {scale, pointLT} = this.data;
    // for (let i = 0; i < this.data.rectInfoList.length; i++) {
    //   const r = this.data.rectInfoList[i];
    //   regions.push({
    //     x: (r.x - pointLT.x) * scale,
    //     y: (r.y - pointLT.y) * scale,
    //     width: r.width * scale,
    //     height: r.height * scale,
    //     method: 'blur'
    //   })
    // }

    try {
      const processedImageData = await remover.removeWatermarks(imageUrl, regions);
      
      // 显示处理后的图片
      // this.displayImage(processedImageData, 'inpaint-result');
      result = processedImageData;
    } catch (error) {
      console.error('处理失败:', error);
    }
    return result;
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})