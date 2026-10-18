require "test_helper"

# The landing page at /. It presents Blade and sends the visitor either to the
# login page or straight to the builder. current_user is stubbed because
# User.dev_user always resolves in the test environment.
class LandingPageTest < ActionController::TestCase
  tests LandingController

  setup do
    @controller.define_singleton_method(:current_user) { nil }
  end

  test "presents the system" do
    get :show

    assert_response :success
    assert_select "h1", /algoritmos/i
    assert_select "[data-feature]", minimum: 3
  end

  test "sends the sign in to the login page instead of straight to Google" do
    get :show

    assert_select "a[href=?]", "/login", /entrar/i
    assert_select "form[action=?]", "/auth/google_oauth2", false
  end

  test "opens the builder as a visitor" do
    get :show

    assert_select "a[href=?]", "/builder", /visitante/i
  end

  test "says what signing in adds" do
    get :show

    assert_select "body", /salvar/i
  end

  test "a signed in visitor is offered to continue" do
    user = User.new(name: "Ana Souza", login: "ana@utfpr.edu.br")
    @controller.define_singleton_method(:current_user) { user }

    get :show

    assert_select "a[href=?]", "/builder", /Continuar como Ana/
    assert_select "a[href=?]", "/login", false
  end

  # Real screenshots of the builder, so the landing shows the product as it is.
  test "shows real screenshots of the builder, the desk check and the code" do
    get :show

    assert_select "img[src*=?][alt*=?]", "landing/builder", "teste de mesa"
    assert_select "img[src*=?]", "landing/teste-de-mesa"
    assert_select "img[src*=?]", "landing/codigo"
    assert_select "img[alt='']", false
  end
end
