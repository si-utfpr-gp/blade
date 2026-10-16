require "test_helper"

# Rendering the login page needs current_user to be nil, which is never the
# case in the test environment because User.dev_user always resolves. An
# ActionController::TestCase is the only way to observe an anonymous visitor,
# so the page markup is asserted here and the OAuth flow lives in the
# integration test next door.
class SessionsPageTest < ActionController::TestCase
  tests SessionsController

  setup do
    @controller.define_singleton_method(:current_user) { nil }
  end

  test "renders a Google sign in form" do
    get :new

    assert_response :success
    assert_select "form[action=?][method=?]", "/auth/google_oauth2", "post"
  end

  # Turbo intercepts form submissions and follows the redirect to Google with
  # fetch, which breaks the OAuth handshake. The form opts out explicitly.
  test "the form opts out of Turbo" do
    get :new

    assert_select "form[data-turbo=false]"
  end

  test "the form is a plain POST that works without javascript" do
    get :new

    assert_select "form[data-turbo=false][method=post]"
    assert_select "form button[type=submit]"
  end

  test "the form carries a CSRF token when forgery protection is on" do
    previous = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true

    get :new

    assert_select "form input[name=authenticity_token]"
  ensure
    ActionController::Base.allow_forgery_protection = previous
  end

  test "explains the sign in requirement" do
    get :new

    assert_select "h1", /Monte e execute algoritmos em blocos/
  end

  test "shows the refusal message when the controller provides one" do
    # The flash is written by a previous request, which a controller test cannot
    # reproduce, so it is supplied directly.
    @controller.define_singleton_method(:flash) do
      { alert: "Use uma conta institucional para entrar." }.with_indifferent_access
    end

    get :new

    assert_select "[role=alert]", /institucional/i
  end

  test "no alert is rendered when there is nothing to report" do
    get :new

    assert_select "[role=alert]", false
  end
end
