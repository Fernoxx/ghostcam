import { useEffect, useRef, useState, useCallback } from "react";
import { WagmiConfig, useConnect, useAccount, useWriteContract } from "wagmi";
import { wagmiConfig } from "../wagmiConfig";
import { GHOSTCAM_ABI } from "../lib/GhostCamABI";

const CONTRACT_ADDRESS = "0x422d2d64835c76570dbe858bd58fadfd85b7cd67";

// Replace with your NFT.Storage key (exposed on frontend → create temp tokens with limited scope)
const NFT_STORAGE_TOKEN = "YOUR_NFT_STORAGE_API_KEY";

export default function Home() {
  /**  Wallet hooks  */
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  /**  Refs / state  */
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [minting, setMinting] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [scare, setScare] = useState(false);

  /* ========== Wallet auto-connect on load ========== */
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connectors, connect]);

  /* ========== Camera + WebGL bootstrap ========== */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        initGl();
      } catch (err) {
        console.error("Camera permission denied", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Build WebGL night-vision pipeline */
  const initGl = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    if (!gl) {
      console.error("WebGL2 not available");
      return;
    }

    const vsSource = `#version 300 es\nprecision mediump float;\nin vec2 a_position;\nin vec2 a_texCoord;\nout vec2 v_texCoord;\nvoid main() {\n  v_texCoord = a_texCoord;\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}`;

    const fsSource = `#version 300 es\nprecision mediump float;\n\nuniform sampler2D u_texture;\nuniform vec2 u_resolution;\nuniform float u_time;\nuniform vec2 u_tilt;\nuniform float u_intensity;\n\nin vec2 v_texCoord;\nout vec4 outColor;\n\n// Simple hash noise\nfloat rand(vec2 co){ return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453); }

void main() {
  // Distort coords with tilt & time-based glitch
  vec2 uv = v_texCoord;
  uv.x += (u_tilt.x * 0.02) + sin(u_time + uv.y * 10.0) * 0.005 * u_intensity;
  uv.y += (u_tilt.y * 0.02);

  vec3 color = texture(u_texture, uv).rgb;
  // Night vision tint -> emphasise green channel
  float grey = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 greenTint = vec3(0.1, 1.0, 0.1);
  color = mix(color, grey * greenTint, 0.8);

  // Overlay ghostly noise
  float noise = rand(uv * u_time * 50.0) * 0.4 * u_intensity;
  color += vec3(noise, noise * 0.5, noise);

  // Vignette
  float dist = distance(uv, vec2(0.5));
  color *= smoothstep(0.9, 0.4, dist);

  outColor = vec4(color, 1.0);
}`;

    // compile helpers
    function compile(type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error", gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error", gl.getProgramInfoLog(program));
    }

    // quad data
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW
    );

    // lookups
    const aPos = gl.getAttribLocation(program, "a_position");
    const aUv = gl.getAttribLocation(program, "a_texCoord");
    const uTexture = gl.getUniformLocation(program, "u_texture");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uTilt = gl.getUniformLocation(program, "u_tilt");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let start = performance.now();
    let tiltX = 0,
      tiltY = 0;
    let intensity = 0.8;

    /* Device orientation */
    window.addEventListener("deviceorientation", (e) => {
      tiltX = (e.gamma ?? 0) / 90; // ‑1..1
      tiltY = (e.beta ?? 0) / 90;

      // Trigger jumpscare when within spooky range
      if (!scare && tiltY > 0.3 && tiltY < 0.6 && tiltX > -0.1 && tiltX < 0.1) {
        setScare(true);
        intensity = 2.0;
        const audio = new Audio("/assets/jumpscare.mp3");
        audio.play();
        setTimeout(() => {
          intensity = 0.8;
          setScare(false);
        }, 1500);
      }
    });

    function render() {
      const time = (performance.now() - start) / 1000;
      if (video.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGB,
          gl.RGB,
          gl.UNSIGNED_BYTE,
          video
        );
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      // positions
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      // uvs
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1i(uTexture, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uTilt, tiltX, tiltY);
      gl.uniform1f(uIntensity, intensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }

    setGlReady(true);
    requestAnimationFrame(render);
  };

  /* ========== Resize canvas to fill screen ========== */
  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  /* ========== Capture & Mint flow ========== */
  const handleCaptureAndMint = async () => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL("image/png");
    setMinting(true);

    try {
      // Upload to IPFS via NFT.Storage
      const blob = await (await fetch(dataURL)).blob();
      const uploadRes = await fetch("https://api.nft.storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NFT_STORAGE_TOKEN}`,
        },
        body: blob,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.ok) throw new Error("IPFS upload failed");
      const tokenURI = `ipfs://${uploadJson.value.cid}`;

      // Mint NFT (user signs tx)
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: GHOSTCAM_ABI,
        functionName: "mintWithURI",
        args: [tokenURI],
      });
      alert("NFT Minted Successfully!");
    } catch (err) {
      console.error(err);
      alert("Mint failed. See console for details.");
    } finally {
      setMinting(false);
    }
  };

  return (
    <WagmiConfig config={wagmiConfig}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "black",
          position: "relative",
        }}
      >
        {/* Hidden video element (camera source) */}
        <video
          ref={videoRef}
          style={{ display: "none" }}
          playsInline
          muted
        />

        {/* WebGL output */}
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

        {/* UI overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            color: "#7CFF7C",
            fontFamily: "monospace",
            textShadow: "0 0 8px #00ff88",
          }}
        >
          <span>{isConnected ? `🪙 ${address?.slice(0, 6)}…${address?.slice(-4)}` : "Connecting wallet…"}</span>
          <span>{scare ? "👻 GHOST DETECTED!" : "Night-Vision Active"}</span>
        </div>

        {glReady && isConnected && (
          <button
            onClick={handleCaptureAndMint}
            disabled={minting}
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "1rem 2.5rem",
              background: "#00ff88",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              fontSize: "1.1rem",
              fontWeight: 700,
              boxShadow: "0 0 12px #00ff88",
              cursor: "pointer",
            }}
          >
            {minting ? "Minting…" : "Capture & Mint"}
          </button>
        )}
      </div>
    </WagmiConfig>
  );
}