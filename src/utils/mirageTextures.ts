import { CanvasTexture, RepeatWrapping } from 'three';

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createSandTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  // Mirage 风格暖黄沙地
  ctx.fillStyle = '#d8b878';
  ctx.fillRect(0, 0, 512, 512);

  // 底层波纹
  for (let y = 0; y < 512; y += 4) {
    const alpha = 0.03 + Math.random() * 0.04;
    ctx.fillStyle = `rgba(180, 140, 85, ${alpha})`;
    ctx.fillRect(0, y, 512, 2);
  }

  // 沙粒（Valorant 风格：干净、低噪点）
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.12 + 0.03;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(160, 120, 75, ${alpha})` : `rgba(235, 205, 150, ${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

export function createStuccoTexture(baseColor = '#e8d5b0'): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // 墙面斑驳（低噪点、干净）
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 2.5 + 0.8;
    const alpha = Math.random() * 0.08 + 0.02;
    ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${100 + Math.random() * 35}, ${60 + Math.random() * 30}, ${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  // 细微裂缝
  ctx.strokeStyle = 'rgba(100, 80, 50, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createTileTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  // Mirage 标志性的蓝绿色瓷砖（Valorant 风格：高饱和度、干净勾缝）
  ctx.fillStyle = '#1e4d4d';
  ctx.fillRect(0, 0, 512, 512);

  const tile = 64;
  for (let y = 0; y < 512; y += tile) {
    for (let x = 0; x < 512; x += tile) {
      const checker = (x / tile + y / tile) % 2 === 0;
      const shade = checker ? '#3db3b3' : '#2a8a8a';
      ctx.fillStyle = shade;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

      // 勾缝
      ctx.strokeStyle = '#143838';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

export function createTrimTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 128);
  // 更亮的蓝绿色腰线，高对比度
  ctx.fillStyle = '#1a4040';
  ctx.fillRect(0, 0, 512, 128);

  const tile = 64;
  for (let x = 0; x < 512; x += tile) {
    const shade = (x / tile) % 2 === 0 ? '#4dd0d0' : '#38b0b0';
    ctx.fillStyle = shade;
    ctx.fillRect(x + 2, 4, tile - 4, 120);
    ctx.strokeStyle = '#0f2a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, 4, tile - 4, 120);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

export function createWoodTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  // Valorant 风格木箱：颜色鲜明、纹理清晰
  ctx.fillStyle = '#b08250';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 32) {
    ctx.fillStyle = `rgba(80, 55, 32, ${0.12 + Math.random() * 0.1})`;
    ctx.fillRect(0, y, 512, 2 + Math.random() * 3);
  }

  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(60, 42, 24, ${0.08 + Math.random() * 0.1})`;
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 8);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

export function createMetalTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  // 干净金属
  ctx.fillStyle = '#7a8595';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.18 + 0.04;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(55, 60, 72, ${alpha})` : `rgba(160, 170, 190, ${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createStripedAwningTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 128);
  const stripe = 32;
  for (let x = 0; x < 512; x += stripe) {
    ctx.fillStyle = ((x / stripe) % 2 === 0) ? '#c53030' : '#f7fafc';
    ctx.fillRect(x, 0, stripe, 128);
  }

  // 阴影褶皱
  for (let i = 0; i < 16; i++) {
    const x = i * 32;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + 28, 0, 4, 128);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export function createVineTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.clearRect(0, 0, 256, 256);

  // 藤蔓叶片
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = 8 + Math.random() * 16;
    ctx.fillStyle = `rgba(${50 + Math.random() * 40}, ${120 + Math.random() * 60}, ${50 + Math.random() * 30}, ${0.5 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

export function createConcreteTexture(): CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  // 干净混凝土
  ctx.fillStyle = '#b8b8b0';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.5 + 0.5;
    const alpha = Math.random() * 0.1 + 0.02;
    ctx.fillStyle = `rgba(${110 + Math.random() * 30}, ${110 + Math.random() * 30}, ${105 + Math.random() * 25}, ${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createSignTexture(text: string, color = '#ffffff', bg = '#c53030'): CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 128);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = color;
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}
