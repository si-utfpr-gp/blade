require "test_helper"

# The login page at /login, where the visitor picks between signing in as a
# student (Google) and opening the builder as a guest. Showing it to an
# anonymous visitor needs current_user to be nil, which is never the case in
# the test environment because User.dev_user always resolves. An
# ActionController::TestCase is the only way to observe that visitor, so the
# page markup is asserted here and the OAuth flow lives in the integration
# test next door.
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

  test "asks how the visitor wants to get in" do
    get :new

    assert_select "h1", /entrar/i
    assert_select "h2", /aluno/i
    assert_select "h2", /visitante/i
  end

  test "the student option signs in with Google to save algorithms" do
    get :new

    assert_select "[data-access=aluno] form[action=?]", "/auth/google_oauth2"
    assert_select "[data-access=aluno]", /salvar/i
  end

  # The builder is open: a visitor draws, runs the desk check and exports,
  # and only saving needs an account.
  test "the visitor option opens the builder without signing in" do
    get :new

    assert_select "[data-access=visitante] a[href=?]", "/builder", /visitante/i
    assert_select "[data-access=visitante]", /não salva/i
  end

  test "links back to the landing page" do
    get :new

    assert_select "a[href=?]", "/"
  end

  test "a signed in visitor is offered to continue instead of signing in again" do
    user = User.new(name: "Ana Souza", login: "ana@utfpr.edu.br")
    @controller.define_singleton_method(:current_user) { user }

    get :new

    assert_select "form[action=?]", "/auth/google_oauth2", false
    assert_select "a[href=?]", "/builder", /Continuar como Ana/
    assert_select "form[action=?][method=?]", "/logout", "post"
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
