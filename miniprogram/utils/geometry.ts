/**
 * 几何计算工具类
 * 提供常用的二维几何计算功能
 */

// 点坐标接口
export interface Point {
  x: number;
  y: number;
}

// 线段接口
export interface Line {
  start: Point;
  end: Point;
}

// 矩形接口
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 圆形接口
export interface Circle {
  center: Point;
  radius: number;
}

// 多边形接口
export interface Polygon {
  points: Point[];
}

export class GeometryUtils {
  /**
   * 计算两点之间的距离
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 两点之间的距离
   */
  static distance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算点到原点的距离
   * @param point 点坐标
   * @returns 到原点的距离
   */
  static distanceToOrigin(point: Point): number {
    return Math.sqrt(point.x * point.x + point.y * point.y);
  }

  /**
   * 判断点是否在矩形范围内
   * @param point 点坐标
   * @param rect 矩形
   * @returns 是否在矩形内
   */
  static isPointInRectangle(point: Point, rect: Rectangle): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width && 
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }

  /**
   * 判断点是否在圆形范围内
   * @param point 点坐标
   * @param circle 圆形
   * @returns 是否在圆形内
   */
  static isPointInCircle(point: Point, circle: Circle): boolean {
    const distance = this.distance(point, circle.center);
    return distance <= circle.radius;
  }

  /**
   * 判断点是否在多边形内（射线法）
   * @param point 点坐标
   * @param polygon 多边形
   * @returns 是否在多边形内
   */
  static isPointInPolygon(point: Point, polygon: Polygon): boolean {
    const { points } = polygon;
    if (points.length < 3) return false;

    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * 计算点到线段的距离
   * @param point 点坐标
   * @param line 线段
   * @returns 点到线段的距离
   */
  static distanceToLine(point: Point, line: Line): number {
    const { start, end } = line;
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return this.distance(point, start);
    }

    let param = dot / lenSq;
    let xx, yy;

    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两条线段是否相交
   * @param line1 第一条线段
   * @param line2 第二条线段
   * @returns 是否相交
   */
  static doLinesIntersect(line1: Line, line2: Line): boolean {
    const { start: p1, end: p2 } = line1;
    const { start: p3, end: p4 } = line2;

    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    
    if (denominator === 0) return false;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  /**
   * 计算两条线段的交点
   * @param line1 第一条线段
   * @param line2 第二条线段
   * @returns 交点坐标，如果不相交返回null
   */
  static getLineIntersection(line1: Line, line2: Line): Point | null {
    const { start: p1, end: p2 } = line1;
    const { start: p3, end: p4 } = line2;

    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    
    if (denominator === 0) return null;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      };
    }

    return null;
  }

  /**
   * 计算矩形的面积
   * @param rect 矩形
   * @returns 面积
   */
  static getRectangleArea(rect: Rectangle): number {
    return rect.width * rect.height;
  }

  /**
   * 计算圆的面积
   * @param circle 圆形
   * @returns 面积
   */
  static getCircleArea(circle: Circle): number {
    return Math.PI * circle.radius * circle.radius;
  }

  /**
   * 计算多边形的面积（鞋带公式）
   * @param polygon 多边形
   * @returns 面积
   */
  static getPolygonArea(polygon: Polygon): number {
    const { points } = polygon;
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * 计算两点之间的中点
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 中点坐标
   */
  static getMidpoint(point1: Point, point2: Point): Point {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    };
  }

  /**
   * 计算点到点的角度（弧度）
   * @param from 起始点
   * @param to 目标点
   * @returns 角度（弧度）
   */
  static getAngle(from: Point, to: Point): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  /**
   * 计算点到点的角度（度数）
   * @param from 起始点
   * @param to 目标点
   * @returns 角度（度数）
   */
  static getAngleDegrees(from: Point, to: Point): number {
    return this.getAngle(from, to) * 180 / Math.PI;
  }

  /**
   * 根据角度和距离计算目标点
   * @param start 起始点
   * @param angle 角度（弧度）
   * @param distance 距离
   * @returns 目标点
   */
  static getPointByAngle(start: Point, angle: number, distance: number): Point {
    return {
      x: start.x + Math.cos(angle) * distance,
      y: start.y + Math.sin(angle) * distance
    };
  }

  /**
   * 判断两个矩形是否相交
   * @param rect1 第一个矩形
   * @param rect2 第二个矩形
   * @returns 是否相交
   */
  static doRectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }

  /**
   * 获取两个矩形的交集
   * @param rect1 第一个矩形
   * @param rect2 第二个矩形
   * @returns 交集矩形，如果不相交返回null
   */
  static getRectangleIntersection(rect1: Rectangle, rect2: Rectangle): Rectangle | null {
    if (!this.doRectanglesIntersect(rect1, rect2)) {
      return null;
    }

    const x = Math.max(rect1.x, rect2.x);
    const y = Math.max(rect1.y, rect2.y);
    const width = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - x;
    const height = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - y;

    return { x, y, width, height };
  }

  /**
   * 判断两个圆形是否相交
   * @param circle1 第一个圆形
   * @param circle2 第二个圆形
   * @returns 是否相交
   */
  static doCirclesIntersect(circle1: Circle, circle2: Circle): boolean {
    const distance = this.distance(circle1.center, circle2.center);
    return distance <= circle1.radius + circle2.radius;
  }

  /**
   * 计算点到矩形边界的最短距离
   * @param point 点坐标
   * @param rect 矩形
   * @returns 最短距离
   */
  static distanceToRectangle(point: Point, rect: Rectangle): number {
    const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
    const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两个点之间的曼哈顿距离
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 曼哈顿距离
   */
  static manhattanDistance(point1: Point, point2: Point): number {
    return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y);
  }

  /**
   * 计算两个点之间的切比雪夫距离
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 切比雪夫距离
   */
  static chebyshevDistance(point1: Point, point2: Point): number {
    return Math.max(Math.abs(point2.x - point1.x), Math.abs(point2.y - point1.y));
  }
}
