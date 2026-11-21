// Background music: a YouTube video used as audio only (hidden player, nothing is downloaded).
// Browsers only allow sound after a click, so it starts when the visitor clicks the heart on slide 1.
(() => {
  const VIDEO_ID = 'TZp2hM_pC5I';

  const btn = document.getElementById('music-toggle');
  let player = null, ready = false, wantPlay = false, muted = false;

  function setIcon() {
    btn.classList.toggle('is-muted', muted);
    btn.setAttribute('aria-label', muted ? 'Turn the music on' : 'Mute the music');
    btn.setAttribute('aria-pressed', String(!muted));
  }

  function start() {
    wantPlay = true;
    if (!ready) return;
    player.setVolume(60);
    if (!muted) player.playVideo();
    btn.hidden = false;
  }

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('music-player', {
      width: '200', height: '200', videoId: VIDEO_ID,
      playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: VIDEO_ID, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => { ready = true; if (wantPlay) start(); },
        onStateChange: e => { if (e.data === YT.PlayerState.ENDED) player.playVideo(); },
        onError: () => { btn.hidden = true; },   // e.g. the video cannot be embedded
      },
    });
  };

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  // Start on the first click of the heart (the user's first interaction)
  document.getElementById('heart').addEventListener('click', start);

  btn.addEventListener('click', () => {
    muted = !muted;
    if (ready) muted ? player.pauseVideo() : player.playVideo();
    setIcon();
  });
  setIcon();
})();
