
(function (global) {
  const soundManager = {
    sounds: {},

    loadSounds(soundMap) {
      for (const [name, url] of Object.entries(soundMap)) {
        const audio = new Audio(url);
        audio.preload = "auto";
        this.sounds[name] = audio;
      }
    },

    play(name, loop = false) {
      const audio = this.sounds[name];
      if (!audio) {
        console.warn(`El sonido "${name}" no está cargado.`);
        return;
      }
      audio.loop = loop;
      audio.currentTime = 0;
      audio.play();
    },

    pause(name) {
      const audio = this.sounds[name];
      if (audio) {
        audio.pause();
      }
    },

    stop(name) {
      const audio = this.sounds[name];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    },

    /**
     * Ajusta el volumen gradualmente
     * @param {string} name - nombre del sonido
     * @param {number} volume - destino (0.0 a 1.0)
     * @param {number} duration - tiempo en ms
     */
    async setVolume(name, volume, duration = 1000) {
      const audio = this.sounds[name];
      if (!audio) {
        console.warn(`El sonido "${name}" no está cargado.`);
        return;
      }
      volume = Math.min(1, Math.max(0, volume)); // clamp 0–1

      const startVolume = audio.volume;
      const diff = volume - startVolume;
      if (diff === 0) return;

      const steps = 30; // frames del fade
      const stepTime = duration / steps;

      for (let i = 1; i <= steps; i++) {
        await new Promise((res) => setTimeout(res, stepTime));
        audio.volume = startVolume + (diff * i) / steps;
      }
    },
  };

  global.SoundAPI = soundManager;
})(window);