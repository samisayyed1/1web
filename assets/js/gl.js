/* 1WEB — hero shader: a living brand-gradient "data terrain".
   Low-res render, DPR-capped, pauses off-screen / in background tabs, static under reduced motion. */
(function () {
  'use strict';
  var canvas = document.querySelector('.hero__gl');
  var hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var gl;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  } catch (e) { gl = null; }
  if (!gl) return;

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uHeat;uniform float uScroll;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'float S(vec2 p,float t){',
    ' float n1=fbm(p*.9+vec2(t*.5,-t*.35));',
    ' float n2=fbm(p*1.5+n1*1.5+vec2(-t*.3,t*.45));',
    ' return sin((p.x*1.2-p.y*1.9)*2.4+n2*6.+t*1.1)*.66+sin((p.x*.7+p.y*1.2)*2.9+n1*4.4-t*.8)*.34;',
    '}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;',
    ' float asp=uRes.x/uRes.y;',
    ' vec2 p=(uv-.5)*vec2(asp,1.);',
    ' float t=uTime*.06;',
    ' vec2 m=(uMouse-.5)*vec2(asp,1.);',
    ' vec2 toM=p-m;float dm=length(toM);',
    ' float heat=exp(-dm*dm*5.)*uHeat;',
    ' p+=toM*.08*exp(-dm*dm*6.)*uHeat;',
    ' p.y+=uScroll*.35;',
    ' float e=.008;',
    ' float s=S(p,t);',
    ' vec2 g=vec2(S(p+vec2(e,0.),t)-s,S(p+vec2(0.,e),t)-s)/e;',
    ' vec3 n=normalize(vec3(-g*.11,1.));',
    ' vec3 L=normalize(vec3(-.45,.55,.7));',
    ' vec3 L2=normalize(vec3(.7,-.35,.55));',
    ' float diff=clamp(dot(n,L),0.,1.);',
    ' float spec=pow(clamp(dot(reflect(-L,n),vec3(0.,0.,1.)),0.,1.),16.);',
    ' float rim=pow(clamp(dot(reflect(-L2,n),vec3(0.,0.,1.)),0.,1.),10.);',
    ' float h=s*.5+.5;',
    ' vec3 ink=vec3(.043,.024,.067);',
    ' vec3 deep=vec3(.09,.035,.15);',
    ' vec3 plum=vec3(.27,.13,.4);',
    ' vec3 vio=vec3(.5,.18,.68);',
    ' vec3 lil=vec3(.8,.58,1.);',
    ' vec3 gold=vec3(.988,.71,.078);',
    ' vec3 org=vec3(.886,.486,.122);',
    ' vec3 base=mix(deep,plum,smoothstep(.1,.9,h));',
    ' base=mix(base,vio,smoothstep(.62,1.,h)*.7);',
    ' vec3 col=base*(.22+.8*diff);',
    ' col+=lil*spec*.5;',
    ' float zone=smoothstep(.42,.72,fbm(p*.55+vec2(t*.25,-t*.15)));',
    ' float goldAmt=clamp(zone*.9+heat*.9,0.,1.4);',
    ' col+=mix(org,gold,.35+.65*smoothstep(.3,.9,h))*rim*goldAmt*1.25;',
    ' col+=gold*heat*.05;',
    ' float mask=smoothstep(1.4,.08,length((uv-vec2(.82,.68))*vec2(.9,1.2)));',
    ' col=mix(ink,col,clamp(mask+heat*.3,0.,1.));',
    ' col+=(hash(gl_FragCoord.xy+fract(t*7.))-.5)*.02;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    heat: gl.getUniformLocation(prog, 'uHeat'),
    scroll: gl.getUniformLocation(prog, 'uScroll')
  };

  // Render at reduced resolution — the field is soft, so this is invisible and saves a lot of GPU.
  var scale = coarse ? 0.5 : 0.6;
  var MAX_PX = coarse ? 160000 : 520000; // pixel budget keeps weaker GPUs at 60fps
  var W = 0, H = 0;
  function resize() {
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    var s = scale;
    if (cw * ch * s * s > MAX_PX) s = Math.sqrt(MAX_PX / (cw * ch));
    var w = Math.max(2, Math.round(cw * s));
    var h = Math.max(2, Math.round(ch * s));
    if (w !== W || h !== H) {
      W = canvas.width = w; H = canvas.height = h;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.res, W, H);
      if (!running) draw(performance.now());
    }
  }

  var mouse = { x: .72, y: .58, tx: .72, ty: .58 };
  var heat = .35, heatTarget = .35, lastMove = 0;
  var scroll = 0;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = 1 - (e.clientY - r.top) / r.height;
    heatTarget = 1; lastMove = performance.now();
  }, { passive: true });

  var start = performance.now(), last = start, running = false, visible = true, raf = 0;
  function draw(now) {
    var t = (now - start) / 1000;
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (coarse) { // gentle autonomous drift on touch devices
      mouse.tx = .66 + Math.sin(t * .35) * .16;
      mouse.ty = .6 + Math.cos(t * .27) * .14;
      heatTarget = .7;
    } else if (now - lastMove > 1400) { heatTarget = .35; }
    var k = 1 - Math.pow(.0015, dt);
    mouse.x += (mouse.tx - mouse.x) * k * .6;
    mouse.y += (mouse.ty - mouse.y) * k * .6;
    heat += (heatTarget - heat) * k * .35;
    var rect = hero.getBoundingClientRect();
    scroll = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    gl.uniform1f(U.time, reduce ? 18 : t + 12);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform1f(U.heat, heat);
    gl.uniform1f(U.scroll, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  var first = true;
  function loop(now) {
    if (!running) return;
    draw(now);
    if (first) { first = false; hero.classList.add('gl-on'); }
    raf = requestAnimationFrame(loop);
  }
  function play() {
    if (running || reduce || !visible || document.hidden) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function pause() { running = false; cancelAnimationFrame(raf); }

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  if (reduce) { draw(performance.now()); hero.classList.add('gl-on'); return; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? play() : pause();
    }, { rootMargin: '0px' }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? pause() : play(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); pause(); hero.classList.remove('gl-on'); });
  play();
})();
