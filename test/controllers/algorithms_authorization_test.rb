require "test_helper"

class AlgorithmsAuthorizationTest < ActionController::TestCase
  tests AlgorithmsController

  test "requires authentication" do
    @controller.define_singleton_method(:current_user) { nil }

    get :index, as: :json

    assert_response :unauthorized
    assert_equal "não autenticado", response.parsed_body["error"]
  end
end