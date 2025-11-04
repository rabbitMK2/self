import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// 定义类型
interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface Props {
  simResolution?: number;
  dyeResolution?: number;
  captureResolution?: number;
  densityDissipation?: number;
  velocityDissipation?: number;
  pressure?: number;
  pressureIterations?: number;
  curl?: number;
  splatRadius?: number;
  splatForce?: number;
  shading?: boolean;
  colorUpdateSpeed?: number;
  backColor?: ColorRGB;
  transparent?: boolean;
  className?: string;
}

interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: ColorRGB;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

interface WebGLExtensions {
  formatRGBA: { internalFormat: number; format: number } | null;
  formatRG: { internalFormat: number; format: number } | null;
  formatR: { internalFormat: number; format: number } | null;
  halfFloatTexType: number;
  supportLinearFiltering: boolean;
}

const FluidCursor: React.FC<Props> = ({
  simResolution = 128,
  dyeResolution = 1440,
  captureResolution = 512,
  densityDissipation = 3.5,
  velocityDissipation = 2,
  pressure = 0.1,
  pressureIterations = 20,
  curl = 3,
  splatRadius = 0.2,
  splatForce = 6000,
  shading = true,
  colorUpdateSpeed = 10,
  backColor = { r: 0.5, g: 0, b: 0 },
  transparent = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // WebGL相关引用
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const extRef = useRef<WebGLExtensions | null>(null);
  
  // 粒子和状态相关引用
  const pointersRef = useRef<Pointer[]>([
    {
      id: -1,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: { r: 0, g: 0, b: 0 },
    }
  ]);
  
  // FBO引用
  const dyeRef = useRef<DoubleFBO | null>(null);
  const velocityRef = useRef<DoubleFBO | null>(null);
  const divergenceRef = useRef<FBO | null>(null);
  const curlRef = useRef<FBO | null>(null);
  const pressureRef = useRef<DoubleFBO | null>(null);
  
  // 动画帧和状态
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const colorUpdateTimerRef = useRef(0.0);

  // 工具函数
  const hashCode = (s: string): number => {
    if (!s.length) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0; // 转换为32位整数
    }
    return hash;
  };

  const addKeywords = (source: string, keywords: string[] | null): string => {
    if (!keywords) return source;
    let keywordsString = "";
    for (const keyword of keywords) {
      keywordsString += `#define ${keyword}\n`;
    }
    return keywordsString + source;
  };

  // WebGL上下文获取
  const getWebGLContext = (canvas: HTMLCanvasElement): { gl: WebGLRenderingContext | WebGL2RenderingContext | null, ext: WebGLExtensions | null } => {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;

    if (!gl) {
      gl = (canvas.getContext("webgl", params) ||
        canvas.getContext("experimental-webgl", params)) as WebGL2RenderingContext | null;
    }

    if (!gl) {
      console.error("Unable to initialize WebGL.");
      return { gl: null, ext: null };
    }

    const isWebGL2 = "drawBuffers" in gl;

    let supportLinearFiltering = false;
    let halfFloat = null;

    if (isWebGL2) {
      (gl as WebGL2RenderingContext).getExtension("EXT_color_buffer_float");
      supportLinearFiltering = !!(gl as WebGL2RenderingContext).getExtension(
        "OES_texture_float_linear",
      );
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = !!gl.getExtension("OES_texture_half_float_linear");
    }

    gl.clearColor(0, 0, 0, 1);

    const halfFloatTexType = isWebGL2
      ? (gl as WebGL2RenderingContext).HALF_FLOAT
      : (halfFloat && (halfFloat as any).HALF_FLOAT_OES) || 0;

    let formatRGBA: { internalFormat: number; format: number } | null = null;
    let formatRG: { internalFormat: number; format: number } | null = null;
    let formatR: { internalFormat: number; format: number } | null = null;

    const getSupportedFormat = (
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      internalFormat: number,
      format: number,
      type: number,
    ): { internalFormat: number; format: number } | null => {
      const texture = gl.createTexture();
      if (!texture) return null;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

      const fbo = gl.createFramebuffer();
      if (!fbo) return null;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status === gl.FRAMEBUFFER_COMPLETE ? { internalFormat, format } : null;
    };

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(
        gl,
        (gl as WebGL2RenderingContext).RGBA16F,
        gl.RGBA,
        halfFloatTexType,
      );
      formatRG = getSupportedFormat(
        gl,
        (gl as WebGL2RenderingContext).RG16F,
        (gl as WebGL2RenderingContext).RG,
        halfFloatTexType,
      );
      formatR = getSupportedFormat(
        gl,
        (gl as WebGL2RenderingContext).R16F,
        (gl as WebGL2RenderingContext).RED,
        halfFloatTexType,
      );
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  };

  // Shader编译和Program创建
  const compileShader = (
    type: number,
    source: string,
    keywords: string[] | null = null,
  ): WebGLShader | null => {
    const shaderSource = addKeywords(source, keywords);
    const shader = glRef.current?.createShader(type) || null;
    if (!shader || !glRef.current) return null;
    
    glRef.current.shaderSource(shader, shaderSource);
    glRef.current.compileShader(shader);
    
    // 检查编译错误
    if (!glRef.current.getShaderParameter(shader, glRef.current.COMPILE_STATUS)) {
      console.error("Shader compilation error:", glRef.current.getShaderInfoLog(shader));
      glRef.current.deleteShader(shader);
      return null;
    }
    
    return shader;
  };

  // 创建Program类
  class Program {
    program: WebGLProgram | null;
    uniforms: Record<string, WebGLUniformLocation | null> = {};

    constructor(vertexShader: WebGLShader | null, fragmentShader: WebGLShader | null) {
      if (!glRef.current) {
        this.program = null;
        return;
      }
      
      this.program = glRef.current.createProgram();
      if (!this.program || !vertexShader || !fragmentShader) {
        this.program = null;
        return;
      }
      
      glRef.current.attachShader(this.program, vertexShader);
      glRef.current.attachShader(this.program, fragmentShader);
      glRef.current.linkProgram(this.program);
      
      // 检查链接错误
      if (!glRef.current.getProgramParameter(this.program, glRef.current.LINK_STATUS)) {
        console.error("Program linking error:", glRef.current.getProgramInfoLog(this.program));
        glRef.current.deleteProgram(this.program);
        this.program = null;
        return;
      }
      
      // 获取uniforms
      const uniformCount = glRef.current.getProgramParameter(this.program, glRef.current.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = glRef.current.getActiveUniform(this.program, i);
        if (uniformInfo) {
          this.uniforms[uniformInfo.name] = glRef.current.getUniformLocation(this.program, uniformInfo.name);
        }
      }
    }

    bind() {
      if (this.program && glRef.current) {
        glRef.current.useProgram(this.program);
      }
    }
  }

  // 创建Material类
  class Material {
    vertexShader: WebGLShader | null;
    fragmentShaderSource: string;
    programs: Record<number, WebGLProgram | null> = {};
    activeProgram: WebGLProgram | null = null;
    uniforms: Record<string, WebGLUniformLocation | null> = {};

    constructor(vertexShader: WebGLShader | null, fragmentShaderSource: string) {
      this.vertexShader = vertexShader;
      this.fragmentShaderSource = fragmentShaderSource;
    }

    setKeywords(keywords: string[]) {
      let hash = 0;
      for (const kw of keywords) {
        hash += hashCode(kw);
      }
      
      let program = this.programs[hash];
      if (program == null && glRef.current) {
        const fragmentShader = compileShader(
          glRef.current.FRAGMENT_SHADER,
          this.fragmentShaderSource,
          keywords,
        );
        program = glRef.current.createProgram();
        
        if (program && this.vertexShader && fragmentShader) {
          glRef.current.attachShader(program, this.vertexShader);
          glRef.current.attachShader(program, fragmentShader);
          glRef.current.linkProgram(program);
          
          // 检查链接错误
          if (!glRef.current.getProgramParameter(program, glRef.current.LINK_STATUS)) {
            console.error("Program linking error:", glRef.current.getProgramInfoLog(program));
            glRef.current.deleteProgram(program);
            program = null;
          }
        }
        
        this.programs[hash] = program;
      }
      
      if (program === this.activeProgram) return;
      
      if (program && glRef.current) {
        // 获取uniforms
        const uniformCount = glRef.current.getProgramParameter(program, glRef.current.ACTIVE_UNIFORMS);
        this.uniforms = {};
        for (let i = 0; i < uniformCount; i++) {
          const uniformInfo = glRef.current.getActiveUniform(program, i);
          if (uniformInfo) {
            this.uniforms[uniformInfo.name] = glRef.current.getUniformLocation(program, uniformInfo.name);
          }
        }
      }
      
      this.activeProgram = program;
    }

    bind() {
      if (this.activeProgram && glRef.current) {
        glRef.current.useProgram(this.activeProgram);
      }
    }
  }

  // FBO创建函数
  const createFBO = (
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): FBO => {
    if (!glRef.current) {
      throw new Error("WebGL context not initialized");
    }
    
    glRef.current.activeTexture(glRef.current.TEXTURE0);
    const texture = glRef.current.createTexture()!;
    glRef.current.bindTexture(glRef.current.TEXTURE_2D, texture);
    glRef.current.texParameteri(glRef.current.TEXTURE_2D, glRef.current.TEXTURE_MIN_FILTER, param);
    glRef.current.texParameteri(glRef.current.TEXTURE_2D, glRef.current.TEXTURE_MAG_FILTER, param);
    glRef.current.texParameteri(glRef.current.TEXTURE_2D, glRef.current.TEXTURE_WRAP_S, glRef.current.CLAMP_TO_EDGE);
    glRef.current.texParameteri(glRef.current.TEXTURE_2D, glRef.current.TEXTURE_WRAP_T, glRef.current.CLAMP_TO_EDGE);
    glRef.current.texImage2D(glRef.current.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    
    const fbo = glRef.current.createFramebuffer()!;
    glRef.current.bindFramebuffer(glRef.current.FRAMEBUFFER, fbo);
    glRef.current.framebufferTexture2D(glRef.current.FRAMEBUFFER, glRef.current.COLOR_ATTACHMENT0, glRef.current.TEXTURE_2D, texture, 0);
    glRef.current.viewport(0, 0, w, h);
    glRef.current.clear(glRef.current.COLOR_BUFFER_BIT);

    const texelSizeX = 1 / w;
    const texelSizeY = 1 / h;

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach(id: number) {
        if (!glRef.current) return 0;
        glRef.current.activeTexture(glRef.current.TEXTURE0 + id);
        glRef.current.bindTexture(glRef.current.TEXTURE_2D, texture);
        return id;
      },
    };
  };

  const createDoubleFBO = (
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): DoubleFBO => {
    const fbo1 = createFBO(w, h, internalFormat, format, type, param);
    const fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      read: fbo1,
      write: fbo2,
      swap() {
        const tmp = this.read;
        this.read = this.write;
        this.write = tmp;
      },
    };
  };

  // 初始化渲染和设置
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 获取WebGL上下文
    const { gl, ext } = getWebGLContext(canvas);
    if (!gl || !ext || !ext.formatRGBA || !ext.formatRG || !ext.formatR) return;
    
    glRef.current = gl;
    extRef.current = ext;

    // 设置Canvas尺寸
    const resizeCanvas = () => {
      if (!canvas) return false;
      const pixelRatio = window.devicePixelRatio || 1;
      const width = scaleByPixelRatio(canvas.clientWidth);
      const height = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    };

    const scaleByPixelRatio = (input: number) => {
      const pixelRatio = window.devicePixelRatio || 1;
      return Math.floor(input * pixelRatio);
    };

    // 配置
    const config = {
      SIM_RESOLUTION: simResolution,
      DYE_RESOLUTION: dyeResolution,
      CAPTURE_RESOLUTION: captureResolution,
      DENSITY_DISSIPATION: densityDissipation,
      VELOCITY_DISSIPATION: velocityDissipation,
      PRESSURE: pressure,
      PRESSURE_ITERATIONS: pressureIterations,
      CURL: curl,
      SPLAT_RADIUS: splatRadius,
      SPLAT_FORCE: splatForce,
      SHADING: shading,
      COLOR_UPDATE_SPEED: colorUpdateSpeed,
      PAUSED: false,
      BACK_COLOR: backColor,
      TRANSPARENT: transparent,
    };

    // 如果不支持线性过滤，降低分辨率
    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    // 获取分辨率
    const getResolution = (resolution: number) => {
      if (!gl) return { width: 0, height: 0 };
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const aspectRatio = w / h;
      const aspect = aspectRatio < 1 ? 1 / aspectRatio : aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspect);
      if (w > h) {
        return { width: max, height: min };
      }
      return { width: min, height: max };
    };

    // 创建全屏三角形
    const blit = (() => {
      if (!gl) return () => {};
      
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      
      const elemBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      return (target: FBO | null, doClear = false) => {
        if (!gl) return;
        
        if (!target) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        
        if (doClear) {
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    // 着色器代码
    const baseVertexShader = compileShader(
      gl.VERTEX_SHADER,
      `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
    
        void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `,
    );

    const copyShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
    
        void main () {
          gl_FragColor = texture2D(uTexture, vUv);
        }
      `,
    );

    const clearShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
    
        void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
        }
      `,
    );

    const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform sampler2D uDithering;
        uniform vec2 ditherScale;
        uniform vec2 texelSize;
    
        vec3 linearToGamma (vec3 color) {
          color = max(color, vec3(0));
          return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }
    
        void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;
    
            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);
    
            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);
    
            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
          #endif
    
          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
        }
      `;

    const splatShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
    
        void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
        }
      `,
    );

    const advectionShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
    
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);
    
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
    
        void main () {
          #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
          #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
          #endif
          float decay = 1.0 + dissipation * dt;
          gl_FragColor = result / decay;
        }
      `,
      ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"],
    );

    const divergenceShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
    
        void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;
    
          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; }
          if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; }
          if (vB.y < 0.0) { B = -C.y; }
    
          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `,
    );

    const curlShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
    
        void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          float vorticity = R - L - T + B;
          gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
      `,
    );

    const vorticityShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
    
        void main () {
          float L = texture2D(uCurl, vL).x;
          float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x;
          float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;
    
          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001;
          force *= curl * C;
          force.y *= -1.0;
    
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity += force * dt;
          velocity = min(max(velocity, -1000.0), 1000.0);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `,
    );

    const pressureShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
    
        void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          float C = texture2D(uPressure, vUv).x;
          float divergence = texture2D(uDivergence, vUv).x;
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `,
    );

    const gradientSubtractShader = compileShader(
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
    
        void main () {
          float L = texture2D(uPressure, vL).x;
          float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x;
          float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `,
    );

    // 创建Programs
    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    // 初始化Framebuffers
    const initFramebuffers = () => {
      if (!gl || !ext) return;
      
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);

      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);

      if (!dyeRef.current || dyeRef.current.width !== dyeRes.width || dyeRef.current.height !== dyeRes.height) {
        dyeRef.current = createDoubleFBO(
          dyeRes.width,
          dyeRes.height,
          rgba.internalFormat,
          rgba.format,
          texType,
          filtering,
        );
      }

      if (!velocityRef.current || velocityRef.current.width !== simRes.width || velocityRef.current.height !== simRes.height) {
        velocityRef.current = createDoubleFBO(
          simRes.width,
          simRes.height,
          rg.internalFormat,
          rg.format,
          texType,
          filtering,
        );
      }

      divergenceRef.current = createFBO(
        simRes.width,
        simRes.height,
        r.internalFormat,
        r.format,
        texType,
        gl.NEAREST,
      );
      
      curlRef.current = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      
      pressureRef.current = createDoubleFBO(
        simRes.width,
        simRes.height,
        r.internalFormat,
        r.format,
        texType,
        gl.NEAREST,
      );
    };

    // 更新keywords
    const updateKeywords = () => {
      const displayKeywords: string[] = [];
      if (config.SHADING) displayKeywords.push("SHADING");
      displayMaterial.setKeywords(displayKeywords);
    };

    // 计算delta时间
    const calcDeltaTime = () => {
      const now = Date.now();
      let dt = (now - lastUpdateTimeRef.current) / 1000;
      dt = Math.min(dt, 0.016666); // 最大60fps
      lastUpdateTimeRef.current = now;
      return dt;
    };

    // 生成颜色
    const generateColor = (): ColorRGB => {
      const h = Math.random();
      const s = 1.0;
      const v = 1.0;
      
      // HSV to RGB conversion
      let r = 0;
      let g = 0;
      let b = 0;
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);

      switch (i % 6) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        case 5:
          r = v;
          g = p;
          b = q;
          break;
      }
      
   // 调整颜色强度 - 增加到原来的1.5倍
  return { r: r * 0.3, g: g * 0.3, b: b * 0.3 };
    };

    // 包装函数
    const wrap = (value: number, min: number, max: number): number => {
      const range = max - min;
      if (range === 0) return min;
      return ((value - min) % range) + min;
    };

    // 更新颜色
    const updateColors = (dt: number) => {
      colorUpdateTimerRef.current += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimerRef.current >= 1) {
        colorUpdateTimerRef.current = wrap(colorUpdateTimerRef.current, 0, 1);
        pointersRef.current.forEach((p) => {
          p.color = generateColor();
        });
      }
    };

    // 应用输入
    const applyInputs = () => {
      pointersRef.current.forEach((p) => {
        if (p.moved) {
          p.moved = false;
          splatPointer(p);
        }
      });
    };

    // Splat函数
    const splat = (x: number, y: number, dx: number, dy: number, color: ColorRGB) => {
      if (!splatProgram || !velocityRef.current || !dyeRef.current || !gl) return;
      
      splatProgram.bind();
      if (splatProgram.uniforms.uTarget) {
        gl.uniform1i(splatProgram.uniforms.uTarget, velocityRef.current.read.attach(0));
      }
      if (splatProgram.uniforms.aspectRatio) {
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      }
      if (splatProgram.uniforms.point) {
        gl.uniform2f(splatProgram.uniforms.point, x, y);
      }
      if (splatProgram.uniforms.color) {
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
      }
      if (splatProgram.uniforms.radius) {
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100));
      }
      blit(velocityRef.current.write);
      velocityRef.current.swap();

      if (splatProgram.uniforms.uTarget) {
        gl.uniform1i(splatProgram.uniforms.uTarget, dyeRef.current.read.attach(0));
      }
      if (splatProgram.uniforms.color) {
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      }
      blit(dyeRef.current.write);
      dyeRef.current.swap();
    };

    // 修正半径
    const correctRadius = (radius: number): number => {
      if (!canvas) return 0;
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      return radius;
    };

    // Splat指针
    const splatPointer = (pointer: Pointer) => {
      const dx = pointer.deltaX * config.SPLAT_FORCE;
      const dy = pointer.deltaY * config.SPLAT_FORCE;
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    };

    // 点击Splat
    const clickSplat = (pointer: Pointer) => {
      const color = generateColor();
      color.r *= 10;
      color.g *= 10;
      color.b *= 10;
      const dx = 10 * (Math.random() - 0.5);
      const dy = 30 * (Math.random() - 0.5);
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
    };

    // 更新指针数据
    const updatePointerDownData = (pointer: Pointer, id: number, posX: number, posY: number) => {
      if (!canvas) return;
      
      pointer.id = id;
      pointer.down = true;
      pointer.moved = false;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1 - posY / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.color = generateColor();
    };

    const updatePointerMoveData = (pointer: Pointer, posX: number, posY: number, color: ColorRGB) => {
      if (!canvas) return;
      
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1 - posY / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.color = color;
    };

    const updatePointerUpData = (pointer: Pointer) => {
      pointer.down = false;
    };

    const correctDeltaX = (delta: number): number => {
      if (!canvas) return 0;
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    };

    const correctDeltaY = (delta: number): number => {
      if (!canvas) return 0;
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    };

    // 步进模拟
    const step = (dt: number) => {
      if (!gl || !velocityRef.current || !dyeRef.current || !divergenceRef.current || !curlRef.current || !pressureRef.current) return;
      
      gl.disable(gl.BLEND);

      // Curl
      curlProgram.bind();
      if (curlProgram.uniforms.texelSize) {
        gl.uniform2f(curlProgram.uniforms.texelSize, velocityRef.current.texelSizeX, velocityRef.current.texelSizeY);
      }
      if (curlProgram.uniforms.uVelocity) {
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocityRef.current.read.attach(0));
      }
      blit(curlRef.current);

      // Vorticity
      vorticityProgram.bind();
      if (vorticityProgram.uniforms.texelSize) {
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocityRef.current.texelSizeX, velocityRef.current.texelSizeY);
      }
      if (vorticityProgram.uniforms.uVelocity) {
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocityRef.current.read.attach(0));
      }
      if (vorticityProgram.uniforms.uCurl) {
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curlRef.current.attach(1));
      }
      if (vorticityProgram.uniforms.curl) {
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      }
      if (vorticityProgram.uniforms.dt) {
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      }
      blit(velocityRef.current.write);
      velocityRef.current.swap();

      // Divergence
      divergenceProgram.bind();
      if (divergenceProgram.uniforms.texelSize) {
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocityRef.current.texelSizeX, velocityRef.current.texelSizeY);
      }
      if (divergenceProgram.uniforms.uVelocity) {
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocityRef.current.read.attach(0));
      }
      blit(divergenceRef.current);

      // Clear pressure
      clearProgram.bind();
      if (clearProgram.uniforms.uTexture) {
        gl.uniform1i(clearProgram.uniforms.uTexture, pressureRef.current.read.attach(0));
      }
      if (clearProgram.uniforms.value) {
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      }
      blit(pressureRef.current.write);
      pressureRef.current.swap();

      // Pressure
      pressureProgram.bind();
      if (pressureProgram.uniforms.texelSize) {
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocityRef.current.texelSizeX, velocityRef.current.texelSizeY);
      }
      if (pressureProgram.uniforms.uDivergence) {
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergenceRef.current.attach(0));
      }
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        if (pressureProgram.uniforms.uPressure) {
          gl.uniform1i(pressureProgram.uniforms.uPressure, pressureRef.current.read.attach(1));
        }
        blit(pressureRef.current.write);
        pressureRef.current.swap();
      }

      // Gradient Subtract
      gradienSubtractProgram.bind();
      if (gradienSubtractProgram.uniforms.texelSize) {
        gl.uniform2f(
          gradienSubtractProgram.uniforms.texelSize,
          velocityRef.current.texelSizeX,
          velocityRef.current.texelSizeY,
        );
      }
      if (gradienSubtractProgram.uniforms.uPressure) {
        gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressureRef.current.read.attach(0));
      }
      if (gradienSubtractProgram.uniforms.uVelocity) {
        gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocityRef.current.read.attach(1));
      }
      blit(velocityRef.current.write);
      velocityRef.current.swap();

      // Advection - velocity
      advectionProgram.bind();
      if (advectionProgram.uniforms.texelSize) {
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocityRef.current.texelSizeX, velocityRef.current.texelSizeY);
      }
      if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) {
        gl.uniform2f(
          advectionProgram.uniforms.dyeTexelSize,
          velocityRef.current.texelSizeX,
          velocityRef.current.texelSizeY,
        );
      }
      const velocityId = velocityRef.current.read.attach(0);
      if (advectionProgram.uniforms.uVelocity) {
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      }
      if (advectionProgram.uniforms.uSource) {
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      }
      if (advectionProgram.uniforms.dt) {
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
      }
      if (advectionProgram.uniforms.dissipation) {
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      }
      blit(velocityRef.current.write);
      velocityRef.current.swap();

      // Advection - dye
      if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) {
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dyeRef.current.texelSizeX, dyeRef.current.texelSizeY);
      }
      if (advectionProgram.uniforms.uVelocity) {
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityRef.current.read.attach(0));
      }
      if (advectionProgram.uniforms.uSource) {
        gl.uniform1i(advectionProgram.uniforms.uSource, dyeRef.current.read.attach(1));
      }
      if (advectionProgram.uniforms.dissipation) {
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      }
      blit(dyeRef.current.write);
      dyeRef.current.swap();
    };

    // 渲染
    const render = (target: FBO | null) => {
      if (!gl || !dyeRef.current) return;
      
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      drawDisplay(target);
    };

    // 绘制显示
    const drawDisplay = (target: FBO | null) => {
      if (!gl || !dyeRef.current) return;
      
      const width = target ? target.width : gl.drawingBufferWidth;
      const height = target ? target.height : gl.drawingBufferHeight;
      displayMaterial.bind();
      if (config.SHADING && displayMaterial.uniforms.texelSize) {
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / width, 1 / height);
      }
      if (displayMaterial.uniforms.uTexture) {
        gl.uniform1i(displayMaterial.uniforms.uTexture, dyeRef.current.read.attach(0));
      }
      blit(target, false);
    };

    // 更新帧
    const updateFrame = () => {
      if (!gl) return;
      
      const dt = calcDeltaTime();
      if (resizeCanvas()) initFramebuffers();
      updateColors(dt);
      applyInputs();
      step(dt);
      render(null);
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    };

    // 鼠标事件处理
    const handleFirstMouseMove = (e: MouseEvent) => {
      const pointer = pointersRef.current[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      const color = generateColor();
      updateFrame();
      updatePointerMoveData(pointer, posX, posY, color);
      document.body.removeEventListener("mousemove", handleFirstMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pointer = pointersRef.current[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      const color = pointer.color;
      updatePointerMoveData(pointer, posX, posY, color);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pointer = pointersRef.current[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerDownData(pointer, -1, posX, posY);
      clickSplat(pointer);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const pointer = pointersRef.current[0];
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerDownData(pointer, touches[i].identifier, posX, posY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const pointer = pointersRef.current[0];
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updatePointerMoveData(pointer, posX, posY, pointer.color);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touches = e.changedTouches;
      const pointer = pointersRef.current[0];
      for (let i = 0; i < touches.length; i++) {
        updatePointerUpData(pointer);
      }
    };

    const handleFirstTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const pointer = pointersRef.current[0];
      for (let i = 0; i < touches.length; i++) {
        const posX = scaleByPixelRatio(touches[i].clientX);
        const posY = scaleByPixelRatio(touches[i].clientY);
        updateFrame();
        updatePointerDownData(pointer, touches[i].identifier, posX, posY);
      }
      document.body.removeEventListener("touchstart", handleFirstTouchStart);
    };

    // 初始化
    updateKeywords();
    initFramebuffers();
    
    // 添加事件监听器
    document.body.addEventListener("mousemove", handleFirstMouseMove);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    document.body.addEventListener("touchstart", handleFirstTouchStart);
    window.addEventListener("touchstart", handleTouchStart, false);
    window.addEventListener("touchmove", handleTouchMove, false);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("resize", initFramebuffers);

    // 清理函数
    return () => {
      // 移除事件监听器
      document.body.removeEventListener("mousemove", handleFirstMouseMove);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      document.body.removeEventListener("touchstart", handleFirstTouchStart);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", initFramebuffers);
      
      // 取消动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // 清理WebGL资源
      if (gl) {
        // 这里可以添加更多资源清理代码
      }
      
      // 重置引用
      glRef.current = null;
      extRef.current = null;
      dyeRef.current = null;
      velocityRef.current = null;
      divergenceRef.current = null;
      curlRef.current = null;
      pressureRef.current = null;
    };
  }, [simResolution, dyeResolution, captureResolution, densityDissipation, velocityDissipation, pressure, pressureIterations, curl, splatRadius, splatForce, shading, colorUpdateSpeed, backColor, transparent]);

  return (
    <div className={cn('pointer-events-none fixed left-0 top-0 z-50 size-full', className)}>
      <canvas
        ref={canvasRef}
        id="fluid"
        className="block h-screen w-screen"
      />
    </div>
  );
};

export default FluidCursor;