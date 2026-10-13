require "test_helper"

class AlgorithmsAuthorizationTest < ActionController::TestCase
  tests AlgorithmsController

  test "requires authentication" do
    @controller.define_singleton_method(:current_user) { nil }

    get :index, as: :json

    assert_response :unauthorized
    assert_equal "", response.parsed_body["error"]
  end
end
# update is a write path, so it must sit behind the same auth gate as create.
class AlgorithmsUpdateAuthorizationTest < ActionController::TestCase
  tests AlgorithmsController

  test "requires authentication" do
    @controller.define_singleton_method(:current_user) { nil }

    patch :update, params: { id: 1, name: "X" }, as: :json

    assert_response :unauthorized
    assert_equal "", response.parsed_body["error"]
  end
end
