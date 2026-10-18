require "test_helper"

# The OAuth round trip, exercised through the real middleware and routes.
# Page markup is covered by SessionsPageTest, which can observe an anonymous
# visitor; here User.dev_user is present, so every request has a user.
class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    User.delete_all
    OmniAuth.config.test_mode = true
  end

  teardown do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end

  # AuthHash shaped like the one OmniAuth builds from Google's response.
  def mock_google(uid: "sub-123", email: "ana@utfpr.edu.br", name: "Ana Souza", verified: true)
    OmniAuth::AuthHash.new(
      provider: "google_oauth2",
      uid: uid,
      info: { email: email, name: name, image: nil },
      extra: { raw_info: { email_verified: verified } }
    )
  end

  def sign_in_as(uid: "sub-123", email: "ana@utfpr.edu.br", name: "Ana Souza")
    OmniAuth.config.mock_auth[:google_oauth2] =
      mock_google(uid: uid, email: email, name: name)
    run_oauth
  end

  # In test mode the request phase redirects to the callback instead of calling
  # the controller inline, so the redirect chain has to be followed.
  def run_oauth
    post "/auth/google_oauth2"
    follow_redirect! while response.redirect? &&
      response.location.to_s.include?("/auth/google_oauth2")
  end

  test "signing in creates the user and records the session" do
    sign_in_as

    assert_redirected_to "http://www.example.com/builder"
    assert_equal "ana@utfpr.edu.br", User.find_by(provider_uid: "sub-123")&.login
    assert session[:user_id]
  end

  test "signing in again reuses the same user" do
    sign_in_as
    first = User.find_by(provider_uid: "sub-123").id
    delete logout_url
    sign_in_as

    assert_equal 1, User.count
    assert_equal first, User.find_by(provider_uid: "sub-123").id
  end

  # Resetting the session before writing the user id stops a session planted by
  # an attacker from surviving the login.
  test "signing in rotates the session" do
    sign_in_as
    get builder_index_url
    session[:planted] = "before"

    sign_in_as

    assert_nil session[:planted]
    assert session[:user_id]
  end

  test "signing out clears the session and returns to the landing page" do
    sign_in_as
    assert session[:user_id]

    delete logout_url

    assert_redirected_to "http://www.example.com/"
  end

  test "a refused account returns to the login page with a message" do
    ENV["GOOGLE_ALLOWED_DOMAINS"] = "utfpr.edu.br"
    User::AllowedEmailDomains.clear_cache!
    OmniAuth.config.mock_auth[:google_oauth2] =
      mock_google(uid: "sub-999", email: "estranho@gmail.com")

    run_oauth

    assert_redirected_to "http://www.example.com/login"
    assert_nil User.find_by(provider_uid: "sub-999")

    # SessionsPageTest covers the rendering; here the flash is what matters.
    assert_match(/institucional/i, flash[:alert].to_s)
  ensure
    ENV.delete("GOOGLE_ALLOWED_DOMAINS")
    User::AllowedEmailDomains.clear_cache!
  end

  test "a callback without an auth hash signs nobody in" do
    get "/auth/google_oauth2/callback"

    assert_nil session[:user_id]
  end

  # The landing presents the system, so it stays reachable after signing in;
  # it offers a way into the builder instead of bouncing the visitor there.
  test "a signed in user still sees the landing page" do
    sign_in_as

    get "/"

    assert_response :success
    assert_select "a[href=?]", "/builder"
  end

  test "the landing page is the root" do
    get "/"

    assert_response :success
    assert_select "#builder", false
    assert_select "#acessos"
  end

  # The login page stays reachable signed in: it offers to continue.
  test "the login page is its own page" do
    get "/login"

    assert_response :success
    assert_select "a[href=?]", "/builder"
  end
end
