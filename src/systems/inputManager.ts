import { useGameStore } from '../stores/gameStore';
import { CAMERA } from '../utils/constants';

/**
 * 输入管理器
 * 集中处理键盘、鼠标事件，并同步到全局状态
 */
export class InputManager {
  private static instance: InputManager | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isPointerLocked = false;
  private isRightDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private boundHandlers: {
    keyDown: (e: KeyboardEvent) => void;
    keyUp: (e: KeyboardEvent) => void;
    mouseMove: (e: MouseEvent) => void;
    mouseDown: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
    wheel: (e: WheelEvent) => void;
    pointerLockChange: () => void;
  };

  private constructor() {
    this.boundHandlers = {
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      wheel: this.handleWheel.bind(this),
      pointerLockChange: this.handlePointerLockChange.bind(this),
    };
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  /**
   * 绑定到指定画布
   */
  attach(canvas: HTMLCanvasElement): void {
    this.detach();
    this.canvas = canvas;

    window.addEventListener('keydown', this.boundHandlers.keyDown);
    window.addEventListener('keyup', this.boundHandlers.keyUp);
    window.addEventListener('mousedown', this.boundHandlers.mouseDown);
    window.addEventListener('mouseup', this.boundHandlers.mouseUp);
    window.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
    window.addEventListener('mousemove', this.boundHandlers.mouseMove);
    window.addEventListener('contextmenu', this.preventContextMenu);
    document.addEventListener('pointerlockchange', this.boundHandlers.pointerLockChange);
  }

  /**
   * 解绑所有事件
   */
  detach(): void {
    window.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    window.removeEventListener('wheel', this.boundHandlers.wheel);
    window.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    window.removeEventListener('keydown', this.boundHandlers.keyDown);
    window.removeEventListener('keyup', this.boundHandlers.keyUp);
    window.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    window.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('pointerlockchange', this.boundHandlers.pointerLockChange);
    this.canvas = null;
  }

  private preventContextMenu = (e: MouseEvent): void => {
    if (this.isRightDragging) {
      e.preventDefault();
    }
  };

  /**
   * 请求鼠标锁定
   */
  requestPointerLock(): void {
    if (this.canvas && document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock().catch(() => {
        // 用户可能未交互，忽略错误
      });
    }
  }

  /**
   * 退出鼠标锁定
   */
  exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const store = useGameStore.getState();
    if (store.isPaused) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        store.setInput({ forward: true });
        break;
      case 'KeyS':
      case 'ArrowDown':
        store.setInput({ backward: true });
        break;
      case 'KeyA':
      case 'ArrowLeft':
        store.setInput({ left: true });
        break;
      case 'KeyD':
      case 'ArrowRight':
        store.setInput({ right: true });
        break;
      case 'Space':
        e.preventDefault();
        store.setInput({ jump: true });
        break;
      case 'KeyR':
        store.setInput({ reload: true });
        break;
      case 'KeyV':
        store.setInput({ switchView: true });
        break;
      case 'KeyC':
        // 重置俯仰角到水平，解决视角卡天/卡地
        store.setCamera({ pitch: 0 });
        break;
      case 'KeyQ':
        // 快速向左转头 90°（受 YAW_LIMIT 限制）
        store.setCamera({ yaw: store.camera.yaw + Math.PI / 2 });
        break;
      case 'KeyE':
        // 快速向右转头 90°（受 YAW_LIMIT 限制）
        store.setCamera({ yaw: store.camera.yaw - Math.PI / 2 });
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        store.setInput({ sprint: true });
        break;
      case 'Digit1':
        store.setInput({ selectWeaponNone: true });
        break;
      case 'Digit2':
        store.setInput({ selectWeaponPrimary: true });
        break;
      case 'BracketLeft':
        store.setSettings({
          mouseSensitivity: Math.max(
            CAMERA.MOUSE_SENSITIVITY_MIN,
            Number((store.settings.mouseSensitivity - 0.1).toFixed(2))
          ),
        });
        break;
      case 'BracketRight':
        store.setSettings({
          mouseSensitivity: Math.min(
            CAMERA.MOUSE_SENSITIVITY_MAX,
            Number((store.settings.mouseSensitivity + 0.1).toFixed(2))
          ),
        });
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const store = useGameStore.getState();
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        store.setInput({ forward: false });
        break;
      case 'KeyS':
      case 'ArrowDown':
        store.setInput({ backward: false });
        break;
      case 'KeyA':
      case 'ArrowLeft':
        store.setInput({ left: false });
        break;
      case 'KeyD':
      case 'ArrowRight':
        store.setInput({ right: false });
        break;
      case 'Space':
        store.setInput({ jump: false });
        break;
      case 'KeyR':
        store.setInput({ reload: false });
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        store.setInput({ sprint: false });
        break;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const store = useGameStore.getState();
    if (store.isPaused) return;

    if (this.isPointerLocked) {
      // Pointer lock：raw input
      store.setInput({
        mouseDeltaX: e.movementX,
        mouseDeltaY: e.movementY,
      });
      return;
    }

    // 未锁定：右键拖拽平移视角
    if (this.isRightDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      // 将像素位移转换为与 pointer lock 接近的视角增量
      const DRAG_SCALE = 3;
      store.setInput({
        mouseDeltaX: dx * DRAG_SCALE,
        mouseDeltaY: dy * DRAG_SCALE,
      });
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      // 未锁定时先请求锁定，已锁定则直接开火
      if (!this.isPointerLocked) {
        this.requestPointerLock();
      }
      useGameStore.getState().setInput({ fire: true });
    } else if (e.button === 2) {
      // 右键拖拽平移视角
      this.isRightDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      useGameStore.getState().setInput({ fire: false });
    } else if (e.button === 2) {
      this.isRightDragging = false;
    }
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const store = useGameStore.getState();
    if (store.isPaused) return;

    const delta = e.deltaY * CAMERA.ZOOM_SENSITIVITY;
    const nextDistance = Math.max(
      CAMERA.MIN_DISTANCE,
      Math.min(CAMERA.MAX_DISTANCE, store.camera.distance + delta)
    );
    store.setCamera({ distance: nextDistance });
  }
}
