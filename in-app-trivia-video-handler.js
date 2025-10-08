/* video-loop-controller.js
 * Control asíncrono de reproducción de video con bucles por tiempo o por fotograma.
 * API principal:
 *   const ctl = new VideoLoopController(videoEl, { fps?: number });
 *   ctl.play(); ctl.pause(); ctl.toggle();
 *   ctl.setLoopByFrames(startF, endF, { restartFromStart = true });
 *   ctl.setLoopByTime(startS, endS, { restartFromStart = true });
 *   ctl.clearLoop({ keepPlaying = true });
 *   ctl.seekToFrame(frame); ctl.seekToTime(seconds);
 *   ctl.setPlaybackRate(rate);
 *   ctl.destroy();
 */

(function (global) {
  class VideoLoopController {
    /**
     * @param {HTMLVideoElement} video
     * @param {{fps?: number}} [opts]
     */
    constructor(video, opts={}) {
      if (!video || !(video instanceof HTMLVideoElement)) {
        throw new Error("Debes pasar un HTMLVideoElement válido.");
      }
      this.video = video;
      this.fps = Number(opts.fps) > 0 ? Number(opts.fps) : null;

      // Estado de bucle en segundos
      this.loopStart = null; // seconds
      this.loopEnd   = null; // seconds
      this.loopActive = false;

      this._usingRVFC = typeof video.requestVideoFrameCallback === "function";
      this._rvfcHandle = null;
      this._timeupdateHandler = null;

      this._metadataReady = false;
      this._queuedActions = [];
      this._seeking = false; // evita rebotes al hacer seek dentro del bucle
      this._destroyed = false;

      // Precarga / metas
      if (video.readyState >= 1 /* HAVE_METADATA */) {
        this._metadataReady = true;
      } else {
        video.addEventListener("loadedmetadata", () => {
          this._metadataReady = true;
          this._flushQueued();
        }, { once: true });
      }

      // Si el video termina y hay bucle, retomamos desde loopStart
      this._onEnded = () => {
        if (this.loopActive && this._hasValidLoop()) {
          this.seekToTime(this.loopStart).then(() => this.play());
        }
      };
      video.addEventListener("ended", this._onEnded);

      // Si estamos con fallback, configuramos el listener
      if (!this._usingRVFC) {
        this._installTimeupdateLoop();
      }
    }

    /* ===================== API PÚBLICA ===================== */

    /** Inicia reproducción (respeta el bucle si está activo) */
    play() {
      if (this._destroyed) return;
      if (!this._metadataReady) return this._queue(() => this.play());
      const p = this.video.play() || Promise.resolve();
      if (this._usingRVFC) this._ensureRVFC();
      return p;
    }

    /** Pausa reproducción */
    pause() {
      if (this._destroyed) return;
      this.video.pause();
      this._cancelRVFC();
    }

    /** Alterna play/pause */
    toggle() {
      if (this.video.paused) return this.play();
      this.pause();
    }

    /**
     * Activa / actualiza bucle por fotogramas (requiere fps conocido).
     * @param {number} startFrame - fotograma inicial (>= 0)
     * @param {number} endFrame - fotograma final (exclusivo). Si es null/undefined, usa duración.
     * @param {{restartFromStart?: boolean, onLoop?: ()=>void}} [opts]
     */
    setLoopByFrames(startFrame, endFrame, opts={}) {
      if (!this.fps) {
        throw new Error("Para usar fotogramas debes pasar { fps } al construir o establecer this.fps.");
      }
      const start = this._frameToTime(startFrame);
      const end = (endFrame == null) ? null : this._frameToTime(endFrame);
      return this.setLoopByTime(start, end, opts);
    }

    /**
     * Activa / actualiza bucle por tiempo (segundos).
     * @param {number} startSec
     * @param {number|null|undefined} endSec - exclusivo; si es null → fin del video.
     * @param {{restartFromStart?: boolean, onLoop?: ()=>void}} [opts]
     */
    setLoopByTime(startSec, endSec, opts={}) {
      if (this._destroyed) return;
      const apply = () => {
        const dur = this._getDuration();
        const start = this._clamp(startSec ?? 0, 0, Math.max(0, dur - 0.001));
        const end = (endSec == null) ? dur : this._clamp(endSec, start + 0.001, dur);
        this.loopStart = start;
        this.loopEnd = end;
        this.loopActive = true;
        this._onLoopCallback = typeof opts.onLoop === "function" ? opts.onLoop : null;

        // Si se pide reiniciar desde el inicio del bucle, hacemos seek ahí
        const restart = opts.restartFromStart !== false;
        if (restart) {
          this.seekToTime(this.loopStart).then(() => {
            if (!this.video.paused) this._kickMonitor();
          });
        } else {
          // si ya estamos fuera del rango, acercamos al rango sin cortar la reproducción
          if (this.video.currentTime < this.loopStart || this.video.currentTime >= this.loopEnd) {
            this.seekToTime(this.loopStart).then(() => {
              if (!this.video.paused) this._kickMonitor();
            });
          } else {
            this._kickMonitor();
          }
        }
      };

      if (!this._metadataReady) return this._queue(apply);
      apply();
    }

    /**
     * Desactiva el bucle actual.
     * @param {{keepPlaying?: boolean}} [opts]
     */
    clearLoop(opts={}) {
      this.loopActive = false;
      this.loopStart = null;
      this.loopEnd = null;
      this._onLoopCallback = null;
      if (!opts.keepPlaying) this._cancelRVFC();
    }

    /** Seek por fotograma (requiere fps) */
    seekToFrame(frame) {
      if (!this.fps) {
        throw new Error("Para usar fotogramas debes pasar { fps } al construir o establecer this.fps.");
      }
      return this.seekToTime(this._frameToTime(frame));
    }

    /** Seek por tiempo (segundos) */
    seekToTime(seconds) {
      if (this._destroyed) return Promise.resolve();
      if (!this._metadataReady) return this._queue(() => this.seekToTime(seconds));
      return new Promise((resolve) => {
        const t = this._clamp(seconds, 0, Math.max(0, this._getDuration() - 0.001));
        const onSeeked = () => {
          this.video.removeEventListener("seeked", onSeeked);
          this._seeking = false;
          resolve();
        };
        this._seeking = true;
        this.video.addEventListener("seeked", onSeeked, { once: true });
        this.video.currentTime = t;
      });
    }

    /** Velocidad de reproducción */
    setPlaybackRate(rate) {
      this.video.playbackRate = Number(rate) || 1;
    }

    /** Limpia recursos y listeners */
    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      this.clearLoop({ keepPlaying: true });
      this._cancelRVFC();
      if (this._timeupdateHandler) {
        this.video.removeEventListener("timeupdate", this._timeupdateHandler);
        this._timeupdateHandler = null;
      }
      if (this._onEnded) {
        this.video.removeEventListener("ended", this._onEnded);
        this._onEnded = null;
      }
    }

    /* ===================== INTERNOS ===================== */

    _kickMonitor() {
      // Reinicia el monitor de bucle según el modo disponible
      if (this._usingRVFC) {
        this._ensureRVFC();
      } else {
        // no hace falta: el timeupdate ya está instalado
      }
    }

    _ensureRVFC() {
      if (this._rvfcHandle != null) return;
      const step = (now, metadata) => {
        this._rvfcHandle = null;

        if (this._destroyed) return;

        if (this.loopActive && this._hasValidLoop() && !this._seeking) {
          const t = this.video.currentTime;
          // margen pequeño para evitar quedarnos al final
          const eps = 0.005;
          if (t + eps >= this.loopEnd) {
            // Disparamos callback de loop si existe
            if (this._onLoopCallback) {
              try { this._onLoopCallback(); } catch (_) {}
            }
            // Volvemos al inicio del bucle
            this.seekToTime(this.loopStart).then(() => {
              if (!this.video.paused) {
                // continuar ciclo
                this._ensureRVFC();
              }
            });
            return;
          }
        }

        if (!this.video.paused) {
          this._rvfcHandle = this.video.requestVideoFrameCallback(step);
        }
      };

      this._rvfcHandle = this.video.requestVideoFrameCallback(step);
    }

    _cancelRVFC() {
      if (this._rvfcHandle != null) {
        try { this.video.cancelVideoFrameCallback(this._rvfcHandle); } catch (_) {}
        this._rvfcHandle = null;
      }
    }

    _installTimeupdateLoop() {
      if (this._timeupdateHandler) return;
      // timeupdate suele dispararse ~4-5 veces/seg; para más precisión, hacemos polling ligero mientras play
      let rafId = null;
      const loopCheck = () => {
        if (this._destroyed) return;
        if (this.loopActive && this._hasValidLoop() && !this._seeking) {
          const t = this.video.currentTime;
          const eps = 0.01;
          if (t + eps >= this.loopEnd) {
            if (this._onLoopCallback) {
              try { this._onLoopCallback(); } catch (_) {}
            }
            this.seekToTime(this.loopStart);
          }
        }
        if (!this.video.paused) {
          rafId = requestAnimationFrame(loopCheck);
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      };

      this._timeupdateHandler = () => {
        if (!rafId && !this.video.paused) {
          rafId = requestAnimationFrame(loopCheck);
        }
      };

      this.video.addEventListener("timeupdate", this._timeupdateHandler);
      // Por si ya está reproduciendo al crear
      if (!this.video.paused) {
        rafId = requestAnimationFrame(loopCheck);
      }
    }

    _hasValidLoop() {
      return typeof this.loopStart === "number" &&
             typeof this.loopEnd === "number" &&
             this.loopEnd > this.loopStart;
    }

    _frameToTime(frame) {
      return Math.max(0, Number(frame) / this.fps);
    }

    _getDuration() {
      const d = this.video.duration;
      return Number.isFinite(d) && d > 0 ? d : 0;
    }

    _clamp(v, min, max) {
      return Math.min(Math.max(v, min), max);
    }

    _queue(fn) {
      this._queuedActions.push(fn);
    }

    _flushQueued() {
      const q = this._queuedActions.slice();
      this._queuedActions.length = 0;
      q.forEach(fn => { try { fn(); } catch(_){} });
    }
  }

  // Export UMD: window.VideoLoopController o module.exports
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = { VideoLoopController };
  } else {
    global.VideoLoopController = VideoLoopController;
  }
})(typeof window !== "undefined" ? window : globalThis);

/* ===================== USO (ejemplos) =====================

HTML:
  <video id="v1" src="ruta/video.mp4" playsinline muted></video>

JS:
  // Si conoces los fps del clip (recomendado para control por fotograma):
  const video = document.getElementById('v1');
  const ctl = new VideoLoopController(video, { fps: 30 });

  // Reproducir / Pausar en cualquier momento:
  ctl.play();
  // ... luego cuando quieras:
  ctl.pause();
  ctl.toggle(); // alterna

  // Hacer un bucle del fotograma 120 al 240 (exclusivo) y arrancar desde 120:
  ctl.setLoopByFrames(120, 240, { restartFromStart: true });

  // Cambiar en caliente a un bucle por tiempo (ej: de 3.5s a 5.2s):
  ctl.setLoopByTime(3.5, 5.2);

  // Ir a un fotograma exacto y seguir reproduciendo:
  ctl.seekToFrame(450);

  // Quitar el bucle pero mantener reproducción:
  ctl.clearLoop({ keepPlaying: true });

  // Cambiar velocidad:
  ctl.setPlaybackRate(1.25);

  // Limpieza (si quitas el video del DOM):
  ctl.destroy();

Notas:
- Para GIFs, conviértelos a video (p.ej., .mp4 o .webm) para poder controlarlos de esta forma.
- Con `requestVideoFrameCallback` (Chrome/Edge/Safari modernos) el control por fotograma es muy preciso. Si no está disponible, se usa un fallback con `timeupdate` + `requestAnimationFrame`.
*/
