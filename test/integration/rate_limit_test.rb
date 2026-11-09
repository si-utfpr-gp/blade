require "test_helper"

# The algorithms API and the sign in callback are throttled, so a script
# cannot flood the database with algorithms or hammer the login. Normal use
# stays far below the limits.
class RateLimitTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.find_or_create_by!(login: "dev") { |user| user.name = "Aluno de Teste" }
    Algorithm.where(user: @user).delete_all
  end

  test "writes to the algorithms API stop at 30 a minute" do
    30.times do |index|
      post algorithms_url, params: { name: "Algoritmo #{index}", diagram: { nodes: [], edges: [] } }, as: :json
      assert_response :created
    end

    post algorithms_url, params: { name: "Um a mais", diagram: { nodes: [], edges: [] } }, as: :json

    assert_response :too_many_requests
    assert_match(/muitas requisições/i, response.parsed_body["error"])
    assert_equal 30, Algorithm.where(user: @user).count
  end

  test "reads stop at 120 a minute" do
    120.times { get algorithms_url, as: :json }
    assert_response :success

    get algorithms_url, as: :json

    assert_response :too_many_requests
  end

  test "the limit opens again after a minute" do
    30.times { |index| post algorithms_url, params: { name: "A#{index}", diagram: { nodes: [], edges: [] } }, as: :json }

    travel 61.seconds do
      post algorithms_url, params: { name: "Depois", diagram: { nodes: [], edges: [] } }, as: :json
      assert_response :created
    end
  end

  # Per address, and a class signs in together from the campus network.
  test "the sign in callback stops at 300 a minute" do
    OmniAuth.config.test_mode = true
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: "google_oauth2", uid: "sub-rate", info: { email: "ana@utfpr.edu.br", name: "Ana" },
      extra: { raw_info: { email_verified: true } }
    )

    300.times do
      get "/auth/google_oauth2/callback"
      assert_redirected_to builder_index_path
    end

    get "/auth/google_oauth2/callback"

    assert_redirected_to login_path
    assert_match(/muitas tentativas/i, flash[:alert])
  ensure
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end
end
