import { WatermarkRegion } from "./MiniProgramWatermarkRemoverSimple";

export class CanvasOperate {
  private m_ctx!: WechatMiniprogram.CanvasContext;
  private m_canvasId!: string;

  constructor() {

  }

  // 1、创建画布内容
  public createCanvasContext(canvasId: string): WechatMiniprogram.CanvasContext {
    this.m_ctx = wx.createCanvasContext(canvasId);
    this.m_canvasId = canvasId;
    return this.m_ctx;
  }

  // 绘制图片
  public drawImage(imageResource: string, dx: number, dy: number, dWidth: number, dHeight: number): void {
    if (!this.m_ctx) {
      return;
    }
    this.m_ctx.drawImage(imageResource, dx, dy, dWidth, dHeight);
  }

  // 最后一步：绘制出来
  public draw(): void {
    if (!this.m_ctx) {
      return;
    }
    this.m_ctx.draw();
  }

  // 绘制矩形
  public drawRect(param: {
      x: number,
      y: number,
      width: number,
      height: number,
      lineWidth?: number,
      strokeStyle?: string,
      lineCap?: "butt" | "round" | "square",
      lineJoin?: "round" | "bevel" | "miter"
    }
  ): void {
    const ctx = this.m_ctx;
    if (!ctx) {
      return;
    }
    const { x, y, width, height, strokeStyle = '#00ff00', lineWidth = 1, lineCap = "butt", lineJoin = "miter" } = param;
    ctx.setStrokeStyle(strokeStyle) // 绿色边框
    ctx.setLineWidth(lineWidth)
    ctx.setLineCap(lineCap)
    ctx.setLineJoin(lineJoin)
    ctx.strokeRect(x, y, width, height);
  }

  public clearRect(x: number, y: number, width: number, height: number): void {
    const ctx = this.m_ctx;
    if (!ctx) {
      return;
    }
    ctx.clearRect(x, y, width, height);
  }

  /**
   * 去除水印
   */
  public removeWatermarks(
    x: number, 
    y: number, 
    width: number,
    height: number,
    imagePath: string, 
    regions: WatermarkRegion[]
  ): void {
    
    const ctx = this.m_ctx;
    if (!ctx) {
      throw new Error('Canvas未初始化，请先设置CanvasId');
    }
    
    // 绘制原始图片
    ctx.drawImage(imagePath, x, y, width, height);
    
    // 处理每个水印区域
    for (const r of regions) {
      this.applyBlurMethod(r);
      this.drawRect({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        lineWidth: 4,
        strokeStyle: "#00ff00",
        lineCap: "round",
        lineJoin: "round"
      });
    }

    // 7. 执行绘制
    ctx.draw()
  }

  /**
   * 使用模糊方法去除水印
   * 由于微信小程序Canvas API不支持getImageData/putImageData，使用简单的覆盖方式
   */
  private applyBlurMethod(region: WatermarkRegion): void {
    if (!this.m_ctx) {
      return;
    }
    // 设置半透明填充色来模拟模糊效果
    this.m_ctx.setGlobalAlpha(0.7);
    this.m_ctx.setFillStyle('#ffffff');
    this.m_ctx.fillRect(region.x, region.y, region.width, region.height);
    this.m_ctx.setGlobalAlpha(1.0);
  }

  /**
   * 保存图片
   * @param x 
   * @param y 
   * @param width 
   * @param height 
   * @returns 
   */
  public saveToTempFilePath(x: number, y: number, width: number, height: number): Promise<string> {
    // 导出处理后的图片
    return new Promise((resolve, reject) => {
      if (!this.m_ctx) {
        resolve("");
        return;
      }
      this.m_ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: this.m_canvasId,
          x,
          y,
          width,
          height,
          destWidth: width,
          destHeight: height,
          success: (res: any) => {
            console.log(`res.tempFilePath=${res.tempFilePath}`);
            resolve(res.tempFilePath);
          },
          fail: reject
        });
      });
    });
  }
}