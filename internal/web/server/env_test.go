package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

// TestSPAEnvRendering locks in the account-service env plumbing: the SPA shell
// carries ACCOUNT_URL / REGISTRATION_CLOSED / SIGNUP_URL from FrontendConfig, and
// leaves them empty when unset (open consumer posture).
func TestSPAEnvRendering(t *testing.T) {
	fsys := fstest.MapFS{
		"index.html": {Data: []byte(
			`ACCOUNT_URL:'{{ .AccountURL }}';REGISTRATION_CLOSED:'{{ .RegistrationClosed }}';SIGNUP_URL:'{{ .SignupURL }}'`)},
	}

	render := func(cfg FrontendConfig) string {
		h := spaHandler(fsys, cfg)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("GET / = %d, want 200", rec.Code)
		}
		return rec.Body.String()
	}

	// Business posture: registration closed, signup pointed at the funnel service.
	body := render(FrontendConfig{
		AccountURL:         "https://get.dmcn.email",
		RegistrationClosed: true,
		SignupURL:          "https://get.dmcn.email",
	})
	for _, want := range []string{
		"ACCOUNT_URL:'https://get.dmcn.email'",
		"REGISTRATION_CLOSED:'true'",
		"SIGNUP_URL:'https://get.dmcn.email'",
	} {
		if !strings.Contains(body, want) {
			t.Errorf("shell missing %q in %q", want, body)
		}
	}

	// Default posture: everything empty (frontend falls back to open behavior).
	body = render(FrontendConfig{})
	for _, want := range []string{"ACCOUNT_URL:''", "REGISTRATION_CLOSED:''", "SIGNUP_URL:''"} {
		if !strings.Contains(body, want) {
			t.Errorf("shell missing %q in %q", want, body)
		}
	}
}
