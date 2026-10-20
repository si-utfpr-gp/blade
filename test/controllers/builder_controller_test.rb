require "test_helper"

# The builder is open to anyone: signing in is what stores work, not what
# allows drawing. FORCE_GOOGLE_LOGIN turns the development fallback user off,
# which is how a request without a session is reproduced in tests.
class BuilderControllerTest < ActionDispatch::IntegrationTest
  setup do
    @original = ENV["FORCE_GOOGLE_LOGIN"]
  end

  teardown do
    ENV["FORCE_GOOGLE_LOGIN"] = @original
  end

  test "renders the builder at /builder" do
    get "/builder"
    assert_response :success
    assert_select "#builder"
  end

  test "exposes the current user name for the header account menu" do
    get builder_index_url
    assert_response :success
    assert_select "#builder[data-user-name=?]", User.dev_user.name
  end

  test "a visitor without a session still gets the builder instead of the login page" do
    ENV["FORCE_GOOGLE_LOGIN"] = "true"

    get builder_index_url

    assert_response :success
    assert_select "#builder"
  end

  test "a visitor without a session has no name to show" do
    ENV["FORCE_GOOGLE_LOGIN"] = "true"

    get builder_index_url

    assert_response :success
    assert_select "#builder[data-user-name='']"
  end

  test "the signed in flag lets the builder hide account only affordances" do
    get builder_index_url

    assert_response :success
    assert_select "#builder[data-signed-in='true']"
  end

  test "the signed in flag is false for a visitor without a session" do
    ENV["FORCE_GOOGLE_LOGIN"] = "true"

    get builder_index_url

    assert_response :success
    assert_select "#builder[data-signed-in='false']"
  end
end
