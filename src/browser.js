'use strict';
/*
 * browser.js — the in-browser player + one-click exporter. Uses the exact same
 * scene.drawFrame() as the Node renderer, so the preview matches the video.
 * Records the canvas to an .mp4 (falls back to .webm) with no installs.
 */
(function () {
  function boot() {
    const CEF = window.CEF;
    const theme = CEF.theme;
    const stage = document.getElementById('stage');
    stage.width = theme.W; stage.height = theme.H;
    const ctx = stage.getContext('2d');

    const { positions, moves } = CEF.chess.replay(CEF.game.san);
    const noise = CEF.fx.makeNoise((w, h) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
    }, 256);
    const story = CEF.storygen.makeStoryboard(CEF.def);
    const deps = { theme, story, positions, moves, noise, brand: CEF.brand };
    const DUR = story.cfg.duration != null ? story.cfg.duration : theme.duration;
    // build.js makes one page per edit, so neither of these may be hardcoded:
    // the export takes the basename the Node renderer writes, and the drop time
    // comes from this edit's own storyboard.
    const SLUG = CEF.editSlug || 'chess-edit';
    const DROP_AT = Math.round(story.cfg.dropAt);

    const statusEl = document.getElementById('status');
    const setStatus = (s) => { if (statusEl) statusEl.textContent = s; };

    let raf = null;
    function play(onDone, startPerf) {
      cancelAnimationFrame(raf);
      const t0 = (startPerf != null) ? startPerf : performance.now();
      const step = (now) => {
        const t = (now - t0) / 1000;
        if (t >= DUR) { CEF.scene.drawFrame(ctx, DUR - 0.001, deps); if (onDone) onDone(); return; }
        CEF.scene.drawFrame(ctx, t, deps);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function loopPreview() { play(() => setTimeout(loopPreview, 400)); }

    function bestMime() {
      const opts = [
        'video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4',
        'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm',
      ];
      for (const m of opts) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {} }
      return '';
    }

    async function exportVideo() {
      cancelAnimationFrame(raf);
      const btn = document.getElementById('export');
      btn.disabled = true;
      const mime = bestMime();
      const ext = mime.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
      setStatus('recording… (' + ext.toUpperCase() + ', ~' + DUR + 's — please wait)');
      const stream = stage.captureStream(30);
      let rec;
      try {
        rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
      } catch (e) {
        rec = new MediaRecorder(stream);
      }
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((res) => { rec.onstop = res; });
      rec.start();
      await new Promise((res) => play(res));   // play exactly once
      rec.stop();
      await stopped;
      const blob = new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = SLUG + '.' + ext;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus('saved ' + SLUG + '.' + ext + ' ✓  — add a trending sound in TikTok, drop hits at ' + DROP_AT + 's');
      btn.disabled = false;
      loopPreview();
    }

    document.getElementById('replay').addEventListener('click', loopPreview);
    document.getElementById('export').addEventListener('click', exportVideo);
    setStatus('ready — press ▶ Replay to preview, or ⭳ Export to save the video');
    loopPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
