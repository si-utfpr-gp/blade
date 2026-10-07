require "test_helper"

class AlgorithmsControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Exercises the real authentication seam: an empty session falls back to
    # the development user, exactly as the builder behaves in development.
    @user = User.find_or_create_by!(login: "dev") { |user| user.name = "Aluno de Teste" }
    @other = User.create!(login: "aluno-outro", name: "Outro Aluno")
    Algorithm.where(user: [ @user, @other ]).delete_all
  end

  test "index lists the current user algorithms, newest first" do
    Algorithm.create!(user: @user, name: "Primeiro", diagram: { "nodes" => [], "edges" => [] })
    Algorithm.create!(user: @user, name: "Segundo", diagram: { "nodes" => [], "edges" => [] })

    get algorithms_url, as: :json

    assert_response :success
    assert_equal [ "Segundo", "Primeiro" ], response.parsed_body.map { |a| a["name"] }
  end

  test "index hides other users algorithms" do
    Algorithm.create!(user: @other, name: "Secreto", diagram: { "nodes" => [], "edges" => [] })

    get algorithms_url, as: :json

    assert_response :success
    assert_empty response.parsed_body
  end

  test "create stores the algorithm for the current user" do
    assert_difference("Algorithm.count") do
      post algorithms_url, params: {
        name: "Meu algoritmo",
        diagram: { nodes: [ { id: "n1", type: "start", position: { x: 1, y: 2 } } ], edges: [] }
      }, as: :json
    end

    assert_response :created
    algorithm = Algorithm.order(:id).last
    assert_equal "Meu algoritmo", algorithm.name
    assert_equal @user, algorithm.user
    assert_equal "n1", algorithm.diagram.dig("nodes", 0, "id")
    assert_equal 1, algorithm.diagram.dig("nodes", 0, "position", "x")
    assert_equal [], algorithm.diagram["edges"]
  end

  test "create rejects a blank name" do
    assert_no_difference("Algorithm.count") do
      post algorithms_url, params: { name: "", diagram: { nodes: [], edges: [] } }, as: :json
    end

    assert_response :unprocessable_entity
  end

  test "show returns the algorithm diagram" do
    algorithm = Algorithm.create!(user: @user, name: "Legivel", diagram: { "nodes" => [ { "id" => "n7" } ], "edges" => [] })

    get algorithm_url(algorithm), as: :json

    assert_response :success
    assert_equal "Legivel", response.parsed_body["name"]
    assert_equal "n7", response.parsed_body.dig("diagram", "nodes", 0, "id")
  end

  test "show refuses algorithms owned by someone else" do
    algorithm = Algorithm.create!(user: @other, name: "Alheio", diagram: { "nodes" => [], "edges" => [] })

    get algorithm_url(algorithm), as: :json

    assert_response :not_found
  end

  test "destroy removes the algorithm" do
    algorithm = Algorithm.create!(user: @user, name: "Descartavel", diagram: { "nodes" => [], "edges" => [] })

    assert_difference("Algorithm.count", -1) do
      delete algorithm_url(algorithm), as: :json
    end

    assert_response :no_content
  end

  test "destroy refuses algorithms owned by someone else" do
    algorithm = Algorithm.create!(user: @other, name: "Intocavel", diagram: { "nodes" => [], "edges" => [] })

    assert_no_difference("Algorithm.count") do
      delete algorithm_url(algorithm), as: :json
    end

    assert_response :not_found
  end
end