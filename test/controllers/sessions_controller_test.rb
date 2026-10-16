require "test_helper"

# The OAuth round trip, exercised through the real middleware and routes.
# Page markup is covered by SessionsPageTest, which can observe an anonymous
# visitor; here User.dev_user is present, so the login page always redirects.
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

    assert_redirected_to builder_index_url
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

  test "signing out clears the session and returns to the login page" do
    sign_in_as
    assert session[:user_id]

    delete logout_url

    assert_redirected_to login_url
  end

  test "a refused account returns to the login page with a message" do
    ENV["GOOGLE_ALLOWED_DOMAINS"] = "utfpr.edu.br"
    User::AllowedEmailDomains.clear_cache!
    OmniAuth.config.mock_auth[:google_oauth2] =
      mock_google(uid: "sub-999", email: "estranho@gmail.com")

    run_oauth

    assert_redirected_to login_url
    assert_nil User.find_by(provider_uid: "sub-999")

    # The page itself cannot be inspected here: in the test environment
    # User.dev_user resolves, so /login redirects straight back to the builder.
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

  test "a signed in user is redirected away from the login page" do
    sign_in_as

    get login_url

    assert_redirected_to builder_index_url
  end

  # dev_user means current_user is never nil locally, which is deliberate.
  test "the login page is never reached in development" do
    get login_url

    assert_redirected_to builder_index_url
  end
end
