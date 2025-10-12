/**
 * 微信小程序图片去水印类 - 简化版本
 * 支持多个矩形区域的水印去除
 * 适配微信小程序的Canvas API
 */

export interface WatermarkRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  method?: 'blur' | 'inpaint' | 'fill';
  fillColor?: string;
}

export class MiniProgramWatermarkRemoverSimple {
  private ctx: WechatMiniprogram.CanvasContext | null = null;
  private canvasId: string;
  private isCanvasCreated: boolean = false;

  /**
   * 构造函数
   * @param canvasId 已有画布id
   */
  constructor(canvasId?: string) {
    this.canvasId = canvasId || '';
  }

  /**
   * 初始化Canvas（通过canvasId查询）
   */
  async initCanvas(): Promise<void> {
    if (this.isCanvasCreated) {
      return Promise.resolve();
    }
    
    if (!this.canvasId) {
      throw new Error('请先设置CanvasId');
    }
    
    return new Promise((resolve, reject) => {
      if (!this.canvasId) {
        reject(new Error('CanvasId未设置'));
        return;
      }

      this.ctx = wx.createCanvasContext(this.canvasId);
      this.isCanvasCreated = true;
      if (this.ctx) {
        console.log("获取ctx成功")
        resolve();
      } else {
        console.log("获取ctx失败")
        reject();
      }
    });
  }

  /**
   * 从本地路径加载图片
   */
  private async loadImage(imagePath: string): Promise<any> {
    // 确保Canvas已初始化
    if (!this.isCanvasCreated) {
      await this.initCanvas();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.ctx) {
        reject(new Error('Canvas未初始化，请先设置CanvasId'));
        return;
      }
      
      // 使用微信小程序的图片加载方式
      wx.getImageInfo({
        src: imagePath,
        success: (res: any) => {
          resolve(res);
        },
        fail: (error: any) => reject(error)
      });
    });
  }

  /**
   * 使用模糊方法去除水印
   * 由于微信小程序Canvas API不支持getImageData/putImageData，使用简单的覆盖方式
   */
  private applyBlurMethod(region: WatermarkRegion): void {
    if (!this.ctx) {
      return;
    }
    // 设置半透明填充色来模拟模糊效果
    this.ctx.setGlobalAlpha(0.7);
    this.ctx.setFillStyle('#ffffff');
    this.ctx.fillRect(region.x, region.y, region.width, region.height);
    this.ctx.setGlobalAlpha(1.0);
  }

  /**
   * 使用填充方法去除水印
   */
  private applyFillMethod(region: WatermarkRegion): void {
    if (!this.ctx) {
      return;
    }
    const fillColor = region.fillColor || '#ffffff';
    this.ctx.setFillStyle(fillColor);
    this.ctx.fillRect(region.x, region.y, region.width, region.height);
  }

  /**
   * 使用修复方法去除水印
   * 由于微信小程序Canvas API不支持getImageData/putImageData，使用渐变填充来模拟修复效果
   */
  private applyInpaintMethod(region: WatermarkRegion): void {
    if (!this.ctx) {
      return;
    }
    // 创建渐变来模拟修复效果
    const gradient = this.ctx.createLinearGradient(
      region.x, region.y, 
      region.x + region.width, region.y + region.height
    );
    
    // 使用多种颜色创建渐变效果
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(0.3, '#e0e0e0');
    gradient.addColorStop(0.7, '#d0d0d0');
    gradient.addColorStop(1, '#c0c0c0');
    
    this.ctx.setFillStyle(gradient);
    this.ctx.fillRect(region.x, region.y, region.width, region.height);
  }

  /**
   * 去除水印
   */
  async removeWatermarks(imagePath: string, regions: WatermarkRegion[]): Promise<string> {
    console.log("图片路径为%s", imagePath);
    try {
      // 确保Canvas已初始化
      if (!this.isCanvasCreated) {
        await this.initCanvas();
      }

      if (!this.ctx) {
        throw new Error('Canvas未初始化，请先设置CanvasId');
      }

      let localImagePath = imagePath;
      
      // if (imagePath.startsWith('http')) {
      //   localImagePath = await this.downloadImage(imagePath);
      // }

      const imgInfo = await this.loadImage(localImagePath);
      console.log("imgInfo=%o", imgInfo);
      
      // 绘制原始图片
      this.ctx.drawImage(imgInfo.path, 0, 0, imgInfo.width, imgInfo.height);
      
      // 处理每个水印区域
      for (const region of regions) {
        const method = region.method || 'blur';
        
        switch (method) {
          case 'blur':
            this.applyBlurMethod(region);
            break;
          case 'fill':
            this.applyFillMethod(region);
            break;
          case 'inpaint':
            this.applyInpaintMethod(region);
            break;
          default:
            this.applyBlurMethod(region);
        }
      }
      
      // 导出处理后的图片
      return new Promise((resolve, reject) => {
        if (!this.ctx) {
          resolve("");
          return;
        }
        this.ctx.draw(false, () => {
          wx.canvasToTempFilePath({
            canvasId: this.canvasId,
            success: (res: any) => {
              console.log(`res.tempFilePath=${res.tempFilePath}`);
              resolve(res.tempFilePath);
            },
            fail: reject
          });
        });
      });
    } catch (error) {
      throw new Error(`去除水印失败: ${error}`);
    }
  }

  /**
   * 去除水印
   */
  async removeWatermarks_v2(ctx: WechatMiniprogram.CanvasContext, imagePath: string, regions: WatermarkRegion[]): Promise<string> {
    console.log("图片路径为%s", imagePath);
    try {
      // 确保Canvas已初始化
      if (!this.isCanvasCreated) {
        await this.initCanvas();
      }

      if (!ctx) {
        throw new Error('Canvas未初始化，请先设置CanvasId');
      }

      let localImagePath = imagePath;
      
      // if (imagePath.startsWith('http')) {
      //   localImagePath = await this.downloadImage(imagePath);
      // }

      const imgInfo = await this.loadImage(localImagePath);
      console.log("imgInfo=%o", imgInfo);
      
      // 绘制原始图片
      ctx.drawImage(imgInfo.path, 0, 0, imgInfo.width, imgInfo.height);
      
      // 处理每个水印区域
      for (const region of regions) {
        const method = region.method || 'blur';
        
        switch (method) {
          case 'blur':
            this.applyBlurMethod(region);
            break;
          case 'fill':
            this.applyFillMethod(region);
            break;
          case 'inpaint':
            this.applyInpaintMethod(region);
            break;
          default:
            this.applyBlurMethod(region);
        }
      }
      
      // 导出处理后的图片
      return new Promise((resolve, reject) => {
        ctx.draw(false, () => {
          wx.canvasToTempFilePath({
            canvasId: this.canvasId,
            success: (res: any) => {
              resolve(res.tempFilePath);
            },
            fail: reject
          });
        });
      });
    } catch (error) {
      throw new Error(`去除水印失败: ${error}`);
    }
  }

  /**
   * 保存处理后的图片到相册
   */
  async saveToAlbum(imagePath: string, regions: WatermarkRegion[]): Promise<void> {
    try {
      const processedImagePath = await this.removeWatermarks(imagePath, regions);
      
      return new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: processedImagePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
            resolve();
          },
          fail: (error: any) => {
            if (error.errMsg && error.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '提示',
                content: '需要授权保存图片到相册',
                success: (res: any) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
            reject(error);
          }
        });
      });
    } catch (error) {
      throw new Error(`保存失败: ${error}`);
    }
  }

  /**
   * 预览处理后的图片
   */
  async previewImage(imagePath: string, regions: WatermarkRegion[]): Promise<void> {
    try {
      const processedImagePath = await this.removeWatermarks(imagePath, regions);
      
      wx.previewImage({
        urls: [processedImagePath],
        current: processedImagePath
      });
    } catch (error) {
      throw new Error(`预览失败: ${error}`);
    }
  }

  /**
   * 批量处理多张图片
   */
  async batchProcess(imagePaths: string[], regions: WatermarkRegion[]): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      try {
        wx.showLoading({
          title: `处理第 ${i + 1} 张图片...`
        });
        
        const processedPath = await this.removeWatermarks(imagePaths[i], regions);
        results.push(processedPath);
        
        wx.hideLoading();
      } catch (error) {
        console.error(`第 ${i + 1} 张图片处理失败:`, error);
        results.push('');
        wx.hideLoading();
      }
    }
    
    return results;
  }

  /**
   * 清理Canvas（仅清理内容，不销毁外部传入的Canvas）
   */
  clearCanvas(): void {
    if (this.ctx) {
      try {
        // 清理Canvas上下文
        this.ctx.clearRect(0, 0, 1000, 1000); // 使用较大的尺寸确保清理完整
        this.ctx.draw();
        console.log('Canvas内容已清理');
      } catch (error) {
        console.error('清理Canvas时出错:', error);
      }
    }
  }

  /**
   * 销毁Canvas（仅重置内部状态，不销毁外部传入的Canvas）
   */
  destroyCanvas(): void {
    try {
      // 清理Canvas上下文
      if (this.ctx) {
        this.ctx.clearRect(0, 0, 1000, 1000);
        this.ctx.draw();
      }
      
      // 重置内部状态
      this.ctx = null;
      this.isCanvasCreated = false;
      
      console.log('Canvas状态已重置');
    } catch (error) {
      console.error('重置Canvas状态时出错:', error);
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.destroyCanvas();
  }

  /**
   * 检查Canvas是否已创建
   */
  isCanvasReady(): boolean {
    return (this.isCanvasCreated && this.ctx !== null);
  }

  /**
   * 获取CanvasId
   */
  getCanvasId(): string {
    return this.canvasId;
  }
}
