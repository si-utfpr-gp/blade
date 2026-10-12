require "test_helper"

class BuilderControllerTest < ActionDispatch::IntegrationTest
  test "renders the builder root" do
    get builder_index_url
    assert_response :success
    assert_select "#builder"
  end

  test "exposes the current user name for the header account menu" do
    get builder_index_url
    assert_response :success
    assert_select "#builder[data-user-name=?]", User.dev_user.name
  end
end