require "test_helper"

# Any path the app does not serve answers 404 with the app's own page, the
# same whatever the method, instead of reaching a controller or Rails' default
# error screens. API callers get JSON.
class NotFoundTest < ActionDispatch::IntegrationTest
  test "an unknown page answers 404 with a way back" do
    get "/admin"

    assert_response :not_found
    assert_select "h1", /não encontrada/i
    assert_select "a[href=?]", "/"
    assert_select "a[href=?]", "/builder"
  end

  test "deep and odd paths are not found either" do
    [ "/algorithms/1/edit", "/../../etc/passwd", "/wp-login.php", "/.env", "/builder/qualquer/coisa" ].each do |path|
      get path

      assert_response :not_found, "#{path} should not be served"
    end
  end

  test "other methods on unknown paths are not found" do
    post "/admin/users"
    assert_response :not_found

    delete "/builder"
    assert_response :not_found

    patch "/about"
    assert_response :not_found
  end

  # Crawlers and command line clients accept anything; they get the page.
  test "a client that accepts anything gets the HTML page" do
    get "/admin", headers: { "Accept" => "*/*" }

    assert_response :not_found
    assert_equal "text/html", response.media_type
  end

  test "API callers get JSON" do
    get "/api/secret", as: :json

    assert_response :not_found
    assert_equal "não encontrado", response.parsed_body["error"]
  end

  test "the pages the app serves keep working" do
    get "/"
    assert_response :success

    get "/up"
    assert_response :success
  end
end
