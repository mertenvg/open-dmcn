package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

// TestSPACacheControl locks in the cache policy that keeps a PWA deploy from
// serving a stale app: the shell is never stored, content-hashed assets are
// immutable, and the service worker (+ other static files) always revalidate.
func TestSPACacheControl(t *testing.T) {
	fsys := fstest.MapFS{
		"index.html":              {Data: []byte("<!doctype html><html><body>shell</body></html>")},
		"assets/index-abc123.js":  {Data: []byte("console.log(1)")},
		"assets/index-def456.css": {Data: []byte(".a{}")},
		"sw.js":                   {Data: []byte("/* service worker */")},
		"manifest.webmanifest":    {Data: []byte("{}")},
	}
	h := spaHandler(fsys, FrontendConfig{})

	cacheControl := func(path string) string {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("GET %s = %d, want 200", path, rec.Code)
		}
		return rec.Header().Get("Cache-Control")
	}

	cases := []struct {
		path, want string
	}{
		// The shell — direct, explicit, and SPA-route fallback — must never be stored.
		{"/", "no-store"},
		{"/index.html", "no-store"},
		{"/inbox", "no-store"}, // client-side route → falls back to the shell
		// Content-hashed assets are immutable and cache for a year.
		{"/assets/index-abc123.js", "public, max-age=31536000, immutable"},
		{"/assets/index-def456.css", "public, max-age=31536000, immutable"},
		// The service worker and other unhashed static files must revalidate so a new
		// build is picked up promptly — a stale sw.js pins clients to an old app.
		{"/sw.js", "no-cache"},
		{"/manifest.webmanifest", "no-cache"},
	}
	for _, c := range cases {
		if got := cacheControl(c.path); got != c.want {
			t.Errorf("Cache-Control for %s = %q, want %q", c.path, got, c.want)
		}
	}
}
