require "test_helper"

# The owner turns a public link on and off through the API; anyone with the
# link opens a read-only page (/s/:token) or the embeddable one
# (/embed/:token), which other sites may put in an iframe.
class AlgorithmSharingFlowTest < ActionDispatch::IntegrationTest
  setup do
    @original = ENV["FORCE_GOOGLE_LOGIN"]
    @user = User.find_or_create_by!(login: "dev") { |user| user.name = "Aluno de Teste" }
    @other = User.create!(login: "outro@utfpr.edu.br", name: "Outro")
    Algorithm.where(user: [ @user, @other ]).delete_all
    @algorithm = @user.algorithms.create!(name: "Soma", diagram: { "nodes" => [ { "id" => "n1", "type" => "startEnd" } ], "edges" => [] })
  end

  teardown do
    ENV["FORCE_GOOGLE_LOGIN"] = @original
  end

  test "the owner turns the public link on and gets the URLs" do
    post algorithm_share_url(@algorithm), as: :json

    assert_response :success
    token = @algorithm.reload.share_token
    assert token
    assert_equal "http://www.example.com/s/#{token}", response.parsed_body["share_url"]
    assert_equal "http://www.example.com/embed/#{token}", response.parsed_body["embed_url"]
  end

  test "someone else's algorithm cannot be shared" do
    theirs = @other.algorithms.create!(name: "Deles", diagram: { "nodes" => [], "edges" => [] })

    post algorithm_share_url(theirs), as: :json

    assert_response :not_found
    assert_nil theirs.reload.share_token
  end

  test "sharing needs an account" do
    ENV["FORCE_GOOGLE_LOGIN"] = "true"

    post algorithm_share_url(@algorithm), as: :json

    assert_response :unauthorized
  end

  test "the owner turns the link off and it stops working" do
    @algorithm.share!
    token = @algorithm.share_token

    delete algorithm_share_url(@algorithm), as: :json
    assert_response :no_content

    get "/s/#{token}"
    assert_response :not_found
  end

  test "anyone with the link opens the read-only page, without an account" do
    @algorithm.share!
    ENV["FORCE_GOOGLE_LOGIN"] = "true"

    get "/s/#{@algorithm.share_token}"

    assert_response :success
    assert_select "#builder[data-mode=?]", "shared"
    assert_select "#builder[data-algorithm-name=?]", "Soma"
    diagram = JSON.parse(css_select("#builder").first["data-diagram"])
    assert_equal "n1", diagram["nodes"].first["id"]
    assert_select "meta[name=robots][content=?]", "noindex"
  end

  test "the page shows nothing about the owner" do
    @algorithm.share!

    get "/s/#{@algorithm.share_token}"

    assert_no_match(/dev|Aluno de Teste|user_id/, css_select("#builder").first.to_html)
  end

  test "only the embed page may be framed by other sites" do
    @algorithm.share!

    get "/embed/#{@algorithm.share_token}"
    assert_response :success
    assert_select "#builder[data-mode=?]", "embed"
    assert_nil response.headers["X-Frame-Options"]
    assert_includes response.headers["Content-Security-Policy"].to_s, "frame-ancestors *"

    get "/s/#{@algorithm.share_token}"
    assert_equal "SAMEORIGIN", response.headers["X-Frame-Options"]

    get "/builder"
    assert_equal "SAMEORIGIN", response.headers["X-Frame-Options"]
  end

  test "a made-up or old token is not found" do
    get "/s/inventado123"
    assert_response :not_found

    get "/embed/inventado123"
    assert_response :not_found
  end
end
