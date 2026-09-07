// Evento del navegador (no de Supabase Realtime) para avisar a otros
// componentes en la misma pestaña que un follow/unfollow acaba de pasar —
// así CommunitySidebar puede refrescar sus contadores sin tener que
// levantar el estado de follows hasta un componente compartido.
const EVENT_NAME = 'kw:follows-changed';

export function notifyFollowsChanged() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onFollowsChanged(callback: () => void): () => void {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
